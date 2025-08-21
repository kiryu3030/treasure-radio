import os
import logging
import time
from datetime import datetime, timedelta

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
filename = f"audio-{datetime.now().strftime('%Y-%m-%d %H-%M-%S')}.log"
logfile = logging.FileHandler(os.path.join(LOG_DIR, filename), 'w', 'utf-8')
logfile.setLevel(logging.DEBUG)
logfile.setFormatter(formatter)
logging.getLogger('').addHandler(logfile)
logging.getLogger('').setLevel(logging.DEBUG)

