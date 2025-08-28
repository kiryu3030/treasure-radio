import os
import logging
import time
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from pythonosc import udp_client
import psutil
import signal
import subprocess

# log資料夾
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(CURRENT_DIR, "logs")
if not os.path.exists(LOG_DIR):
    os.mkdir(LOG_DIR)

# sys.stderr
formatter = logging.Formatter('%(asctime)s %(levelname)s %(module)s: %(message)s')
consolehandler = logging.StreamHandler()
consolehandler.setLevel(logging.DEBUG)
consolehandler.setFormatter(formatter)
logging.getLogger('').addHandler(consolehandler)

# log文件
filename = f"shutdown-{datetime.now().strftime('%Y-%m-%d %H-%M-%S')}.log"
logfile = logging.FileHandler(os.path.join(LOG_DIR, filename), 'w', 'utf-8')
logfile.setLevel(logging.DEBUG)
logfile.setFormatter(formatter)
logging.getLogger('').addHandler(logfile)
logging.getLogger('').setLevel(logging.DEBUG)

def LightShutdown():
  logging.info("Run shutdown")
  maxPid = []
  anyDesk = []
  pidList = psutil.pids()
  for id in pidList:
    p = psutil.Process(id)
    if p.name()=="Max":
      maxPid.append(id)
    elif p.name()=="AnyDesk":
      anyDesk.append(id)
  for i in maxPid:
    try:
      os.kill(i, signal.SIGKILL)
    except Exception as e:
      logging.info(e)
  time.sleep(2)
  try:
    for i in anyDesk:
      os.kill(i, signal.SIGKILL)
  except Exception as e:
    logging.info(e)
  
  subprocess.Popen('/Users/okome/Documents/GitHub/treasure-radio/shutdown.sh', shell=True)

showScheduler = BackgroundScheduler()
now = datetime.now()
SHUTDOWN_TIME = datetime.strptime(f'{now.year}-{now.month}-{now.day} 19:59:00', '%Y-%m-%d %H:%M:%S')
showScheduler.add_job(LightShutdown, 'date', run_date=SHUTDOWN_TIME)
showScheduler.start()

while True:
  time.sleep(10)
