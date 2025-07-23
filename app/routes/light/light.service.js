import express from 'express';
import logger from '../../config/log.config.js';
import response from '../../utilities/response.js';
import requestCode from '../../utilities/response-code.js';
import AppException from '../../utilities/app-exception.js';
import config from '../../config/config.js';
import * as fsPromises from "fs/promises";

const logging = logger(import.meta.url);

let settingBK = {"buttonSwitch":{"water":true,"room":true},"brightness":{"water-a":30,"room-a":100,"water-b":30,"room-b":100,"room-c":100,"room-d":100,"room-e":100},"roomALightType":22,"roomBLightType":22,"roomCLightType":22,"roomDLightType":22,"roomELightType":22,"bLightType":2,"roomCtrl":1};

function S(f) {
  try {
    return JSON.parse(f);
  } catch (error) {
    return settingBK;
  }
}

async function readFileAsync() {
  const fs = fsPromises.readFile(config.lightConfig.path, 'utf8') 
  .then(data => { 
    return data;
  })
  .catch(err => { 
    console.log("Read Error: " +err);
  });
  return fs;
}

async function writeFileAsync(data) {
  const fs = fsPromises.writeFile(config.lightConfig.path, JSON.stringify(data)) 
  .then(() => { 
    return true;
  })
  .catch(err => { 
    console.log("Read Error: " +err);
  });
  return fs;
}

const lightService = {
  /**
   * Get light setting
   * @route {GET} /lights
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
  lightSetting: async(req, res, next) => {
    try {
      let file = await readFileAsync();
      console.log(file);
      if(file==undefined) throw new AppException(200, requestCode.file_read_error, `Can't read file`);
      let setting = S(file);
      console.log(setting);

      res.status(200).json(new response(requestCode.ok, setting));
    } catch (error) {
      logging.error(error);
      next(error);
    }
  },
};

export default lightService;
