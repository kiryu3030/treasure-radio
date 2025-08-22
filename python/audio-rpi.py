import io
import os
import threading
from typing import Optional
import signal
import time
from datetime import datetime, timedelta

import logging
import log_config
import sys
import requests
import sounddevice as sd
import soundfile as sf
import socketio

from find_file import findLastFile

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

class PlaybackManager:
    def __init__(self):
        self._thread: Optional[threading.Thread] = None
        self._stop_flag = threading.Event()
        self._lock = threading.Lock()
        self._volume = 1.0  # 0.0 ~ 1.0
        self._name = ''

    @property
    def name(self)->str:
        return self._name

    def set_volume(self, v: float):
        v = max(0.0, min(1.0, float(v)))
        with self._lock:
            self._volume = v

    @property
    def is_playing(self) -> bool:
        t = None
        with self._lock:
            t = self._thread
        return t is not None and t.is_alive()

    def stop(self):
        """安全地中止播放執行緒並重置狀態"""
        # 先設定旗標與停止音效裝置
        with self._lock:
            self._stop_flag.set()
            try:
                sd.stop()
            except Exception:
                pass
            t = self._thread  # 把參考拿出來，避免在持鎖 join

        # 在不持有 lock 的情況下 join，避免死鎖
        if t and t.is_alive():
            t.join(timeout=2.0)

        # 重置狀態
        with self._lock:
            self._name = ''
            self._thread = None
            self._stop_flag.clear()

    def play_wav_from_url(self, src: str, save_path: str, sio: socketio.Client):
      """
      下載 WAV 檔 -> 存檔 -> 停止舊播放 -> 播放新檔
      注意：在下載階段不會中止目前播放；成功存檔後才 stop。
      """
      # 開一個「下載 + 播放」工作，但在下載完成前 **不** 登記成 self._thread
      def _worker():
          try:
              # ---- 1) 下載或讀取 WAV 到記憶體 ----
              if src.startswith(("http://", "https://")):
                  resp = requests.get(src, timeout=30)
                  resp.raise_for_status()
                  buf = io.BytesIO(resp.content)
                  buf.seek(0)
                  data, sr = sf.read(buf, dtype='float32', always_2d=True)
              else:
                  # 本機路徑
                  data, sr = sf.read(src, dtype='float32', always_2d=True)

              # ---- 2) 存檔（未停播前就先寫好檔案）----
              if src.startswith(("http://", "https://")):
                try:
                    dirpath = os.path.dirname(save_path)
                    if dirpath:
                        os.makedirs(dirpath, exist_ok=True)
                    sf.write(save_path, data, sr)
                    print(f"[client] 已存檔：{save_path}")
                    logging.info(f"[client] 已存檔：{save_path}")
                except Exception as e:
                    print(e)
                    logging.error(f"[client] 存檔失敗：{e}")

              # ---- 3) 這時候才停止舊播放 ----
              self.stop()  # 這裡 join 的只會是「舊的」self._thread，不會是現在這個 _worker

              # ---- 4) 登記本次播放執行緒，並開始播放 ----
              self._name = src.split(' ')[-1]
              with self._lock:
                  self._thread = threading.current_thread()
                  vol = self._volume

              if vol != 1.0:
                  data = data * vol

              if self._stop_flag.is_set():
                  return

              sd.play(data, sr, loop=True)
              sd.wait()

              if not self._stop_flag.is_set():
                  try:
                      sio.emit("client_playback_done", {"src": src, "saved": save_path})
                  except Exception:
                      pass

          except Exception as e:
              print(e)
              logging.error(f"[Player] Error: {e}")
              try:
                  sio.emit("client_error", {"msg": str(e)})
              except Exception:
                  pass
          finally:
              with self._lock:
                  # 若目前 thread 就是登記的，清掉；避免把其他新任務的 thread 清掉
                  if self._thread is threading.current_thread():
                      self._thread = None
                  self._stop_flag.clear()

      t = threading.Thread(target=_worker, daemon=True)
      t.start()

# ===== Socket.IO 用戶端 =====================================================
sio = socketio.Client(logger=True, engineio_logger=False, reconnection=True)
player = PlaybackManager()

@sio.event
def connect():
    print("[client] connected to server")
    logging.info("[client] connected to server")

@sio.event
def disconnect():
    print("[client] disconnected")
    logging.info("[client] disconnected")

# 伺服器端發送：play_audio, data: { "path": "<本機路徑或URL>" }
@sio.on("play_audio")
def on_play_audio(data):
    logging.info(data)
    path = (data or {}).get("path")
    if not path:
        logging.info("[client] play_audio missing 'path'")
        return
    url = f'http://107.167.191.206:8082/treasure-radio/app/static/audio/{path}'
    print(f"[client] play_audio: {url}")
    logging.info(f"[client] play_audio: {url}")
    name = url.split(' ')[-1]
    logging.info(f'reserve:{name} nowplay:{player.name}')
    if name==player.name and player.is_playing:
        print('reserve same file pass')
        logging.info('reserve same file pass')
        return
    player.play_wav_from_url(url, path, sio=sio)

# 伺服器端發送：stop_audio
@sio.on("stop_audio")
def on_stop_audio(_=None):
    logging.info("[client] stop_audio")
    player.stop()

# （可選）伺服器端發送：set_volume, data: { "value": 0.0 ~ 1.0 }
# @sio.on("set_volume")
# def on_set_volume(data):
#     v = (data or {}).get("value", 1.0)
#     logging.info(f"[client] set_volume: {v}")
#     player.set_volume(v)

def ExitSignal(signum, frame):
  if signum == signal.SIGINT.value:
    sio.disconnect()
    player.stop()
    time.sleep(3)
    sys.exit(1)
signal.signal(signal.SIGINT, ExitSignal)

# if __name__ == "__main__":
# 換成你的 Socket.IO 伺服器位址
SERVER_URL = "ws://107.167.191.206:8082"
# 若需要附帶自定 headers / token，可用：
# sio.connect(SERVER_URL, headers={"Authorization": "Bearer xxx"})
# sio.connect(SERVER_URL, transports=['websocket'])
try:
    logging.info(f'CURRENT_DIR: {CURRENT_DIR}')
    lastAudio = findLastFile(CURRENT_DIR)
    if lastAudio:
      logging.info("Find last local audio")
      player.play_wav_from_url(lastAudio, 'test1.wav', sio=sio)
    time.sleep(5)
    while not sio.connected:
      try:
        sio.connect(SERVER_URL, transports=['websocket'])
      except Exception as e:
        logging.error(f"{e}")
        time.sleep(5)
    
    # sio.wait()  # 阻塞，直到中斷
    while True:
        time.sleep(10)
except KeyboardInterrupt:
    pass
except Exception as e:
    print(e)
    logging.error(e)
finally:
    player.stop()
    try:
        sio.disconnect()
    except Exception:
        pass
