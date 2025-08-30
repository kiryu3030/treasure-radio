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

# 列出所有裝置
devices = sd.query_devices()
print("=== 裝置清單 ===")
for idx, d in enumerate(devices):
    logging.info(f"[{idx}] {d['name']} (in:{d['max_input_channels']}, out:{d['max_output_channels']})")

# 找到 "bcm2835 Headphones"
target_name = "bcm2835 Headphones"
# target_name = "Headphones"
target_id = None
for idx, d in enumerate(devices):
    if target_name in d['name']:
        target_id = idx
        break

if target_id is not None:
    sd.default.device = (None, target_id)  # 設定為輸出裝置
    logging.info(f"已將輸出裝置設定為 {target_name} (ID {target_id})")
else:
    logging.info(f"找不到裝置: {target_name}")

class PlaybackManager:
    def __init__(self):
        self._thread: threading.Thread | None = None
        self._lock = threading.Lock()
        self._stop_evt = threading.Event()
        self._volume = 1.0
        self._name = ''
        self._device_id = None      # 若你外面已選到 bcm2835，可不設或設成那個 id
        self._stream = None         # 只在播放執行緒使用

    @property
    def name(self) -> str:
        return self._name

    @property
    def is_playing(self) -> bool:
        with self._lock:
            t = self._thread
        return bool(t and t.is_alive())

    def set_volume(self, v: float):
        v = max(0.0, min(1.0, float(v)))
        with self._lock:
            self._volume = v

    def set_output_device(self, device_id: int):
        self._device_id = device_id
    #     """在不播放時設定下次播放要用的輸出裝置。"""
    #     # with self._lock:
    #     #     if self._thread and self._thread.is_alive():
    #     #         raise RuntimeError("播放中不可切換裝置，請先 stop()")
    #     #     self._device_id = device_id

    def stop(self):
        """只送出停止訊號並等待播放執行緒自己關閉 PortAudio。"""
        with self._lock:
            self._stop_evt.set()
            t = self._thread
        if t and t.is_alive():
            t.join(timeout=2.0)
        with self._lock:
            self._thread = None
            self._stop_evt.clear()
            self._name = ''

    def _play_array(self, data, sr, sio, src, save_path, loop=True):
        """在獨立執行緒內，以 OutputStream 播放 data，支援 loop。"""
        try:
            with self._lock:
                vol = self._volume
                dev = self._device_id

            if vol != 1.0:
                data = data * vol

            i = 0
            nframes = len(data)

            def cb(outdata, frames, time_info, status):
                nonlocal i
                if status:
                    logging.warning(f"[sd] status: {status}")
                if self._stop_evt.is_set():
                    raise sd.CallbackStop

                end = i + frames
                if end >= nframes:
                    # 如果啟用 loop，就回到頭繼續播
                    if loop:
                        part1 = data[i:nframes]
                        part2 = data[:frames - len(part1)]
                        outdata[:len(part1)] = part1
                        outdata[len(part1):] = part2
                        i = len(part2)
                    else:
                        rem = nframes - i
                        if rem > 0:
                            outdata[:rem] = data[i:nframes]
                            outdata[rem:] = 0
                        raise sd.CallbackStop
                else:
                    outdata[:] = data[i:end]
                    i = end

            with sd.OutputStream(
                samplerate=sr,
                channels=data.shape[1],
                dtype='float32',
                device=dev,
                callback=cb,
            ) as self._stream:
                while not self._stop_evt.is_set():
                    sd.sleep(50)

            if not self._stop_evt.is_set() and not loop:
                try:
                    sio.emit("client_playback_done", {"src": src, "saved": save_path})
                except Exception:
                    pass
        except Exception:
            pass

        finally:
            with self._lock:
                self._stream = None
                if self._thread is threading.current_thread():
                    self._thread = None
                self._stop_evt.clear()

    def play_wav_from_url(self, src: str, save_path: str, sio):
        """
        下載 WAV -> 存檔（若是 URL）-> 停舊播 -> 以 OutputStream 播新檔
        """
        # 先下載/讀取到記憶體（不動到 PortAudio）
        if src.startswith(("http://", "https://")):
            resp = requests.get(src, timeout=30)
            resp.raise_for_status()
            buf = io.BytesIO(resp.content); buf.seek(0)
            data, sr = sf.read(buf, dtype='float32', always_2d=True)

            # 存檔
            try:
                os.makedirs(os.path.dirname(save_path) or ".", exist_ok=True)
                sf.write(save_path, data, sr)
                logging.info(f"[client] 已存檔：{save_path}")
            except Exception as e:
                logging.error(f"[client] 存檔失敗：{e}")
        else:
            data, sr = sf.read(src, dtype='float32', always_2d=True)

        # 序列化：先把上一段完整停掉（讓上一個 stream 自己關閉）
        self.stop()

        # 清除停止旗標，準備新播放
        with self._lock:
            self._stop_evt.clear()

        # 開新播放執行緒
        self._name = src.split('_')[-1]
        t = threading.Thread(
            target=self._play_array,
            args=(data, sr, sio, src, save_path),
            daemon=True
        )
        with self._lock:
            self._thread = t
        t.start()

# ===== Socket.IO 用戶端 =====================================================
sio = socketio.Client(logger=True, engineio_logger=False, reconnection=True)
player = PlaybackManager()
player.set_output_device(target_id)

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
    name = url.split('_')[-1]
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
      print("Find last local audio")
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
