import os
from datetime import datetime

def findLastFile(base_dir='.', ignore = ['__pycache__', 'logs']):

  # 找出最新資料夾
  folders = []
  with os.scandir(base_dir) as entries:
      for entry in entries:
          if entry.is_dir():
              mtime = os.path.getmtime(entry.path)
              if entry.name in ignore:
                  continue
              folders.append((entry.name, mtime))

  folders.sort(key=lambda x: x[1], reverse=True)

  if not folders:
      print("沒有資料夾")
      exit()

  latest_folder_name = folders[0][0]
  latest_folder_path = os.path.join(base_dir, latest_folder_name)
  print("最新資料夾：", latest_folder_name)

  # 找出最新資料夾中的檔案（排除資料夾）
  files = []
  with os.scandir(latest_folder_path) as entries:
      for entry in entries:
          if entry.is_file():  # 排除資料夾
              mtime = os.path.getmtime(entry.path)
              files.append((entry.name, mtime))

  files.sort(key=lambda x: x[1], reverse=True)

  if files:
      latest_file_name = files[0][0]
      latest_file_path = os.path.join(latest_folder_path, latest_file_name)
      print("最新檔案：", latest_file_name)
      print("完整路徑：", latest_file_path)
      print("修改時間：", datetime.fromtimestamp(files[0][1]))
  else:
      print("該資料夾沒有檔案")

  return latest_file_path

if __name__ == "__main__":
  findLastFile('.')