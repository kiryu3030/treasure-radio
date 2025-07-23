const express = require('express');
const logger = require('../../config/log.config');
const response = require('../../utilities/response.js');
const requestCode = require('../../utilities/response-code.js');
const AppException = require('../../utilities/app-exception.js');
const UDPClient = require('../udp/udp-client.js');
const { sleep } = require('../../utilities/utils.js');
const { powerPrepareCMD, powerCMD, powerChannelCMD } = require('../../utilities/powerCMD.js');
const MQTTClient = require('../mqtt/mqtt-client.js');
const { parseCSV }  = require('../csv/csv-manager.js');
const path = require('path');

const logging = logger(__filename);

const POWER_CH_CMD = {
  "CH_ON":"2",
  "CH_OFF":"1",
}

const POWER_AREA = {
  "1-1": [14, 15, 16, 17, 18, 19],
  "1-2": [11, 12, 13, 24, 25, 26],
  "1-3": [9, 8, 1, 2, 3, 4],
  "1-4": [27, 28, 29, 37, 38],
  "1-5": [33, 34, 35, 36],
  "1-6": [32, 31, 22, 23, 10, 5, 6],
  "1-7": [40, 41, 45, 46, 49, 50],
  "1-8": [48, 44, 39, 30, 21, 20, 7],
  "2-1": [54, 58, 63, 68, 69],
  "2-2": [53, 57, 62, 67, 66, 72],
  "2-3": [52, 56, 61, 60, 65, 71, 70],
  "2-4": [64, 59, 55, 51, 47, 42, 43],
  "2-5": [75, 81, 82, 86, 87],
  "2-6": [74, 73, 79, 80, 85],
  "2-7": [96, 91, 90, 92, 93],
  "2-8": [89, 88, 84, 83, 78, 77, 76],
  "3-1": [100, 99, 98, 94, 95],
  "3-2": [112, 110, 107, 104, 101, 97],
  "3-3": [111, 109, 106, 103, 102, 105, 108],
  "3-4": [113, 114, 115, 116, 117, 118, 119],
  "3-5": [120, 123, 127, 131, 134, 137],
  "3-6": [121, 122, 125, 126, 130],
  "3-7": [124, 128, 129, 132, 133],
  "3-8": [135, 136, 139, 138, 140],
}

const BOTTON_OFFSET = {
  1: 0,
  2: 90,
  3: 270,
  4: 180,
}

const LED_CMD = {
  "LED_ON":"0",
  "LED_OFF":"1",
}

const stepperCtrl = {

  findArea: (base) => {
    for (const [key, value] of Object.entries(POWER_AREA)){
      if(value.includes(base)){
        console.log(key, value);
        return value;
      }
    }
    return undefined;
  },
}

const stepperService = {
  /**
   * Adjustment
   * @route {GET} /stepper/adjustment/:id
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
  adjustment: async(req, res, next) => {
    try {
      const id = req.params.id;
      console.log(id);

      const bottamAngle = await parseCSV(path.join(process.cwd(), './bottom_angles.csv'));
      const neckAngle = await parseCSV(path.join(process.cwd(), './neck_angles.csv'));
      
      // await sleep(500);
      if(id=="singel"){
        let flowerId = req.body.flowerId;
        let stepperType = req.body.stepperType;
        console.log(flowerId);
        console.log(stepperType);

        const bases = flowerId.split(" ");
        // console.log(bases);

        // console.log(bottamAngle);
        bottamAngle.forEach((element) => {
          // console.log(element[3]);
          if(bases.includes(element[3])) {
            let bottomCmd = "{\"flowerId\":{\""+element[1]+"\":{\"bottom\":{\"offset\":"+element[2]+",\"degree\":"+0+",\"speed\":"+7844+",\"acc\":"+26146+",\"dec\":"+26146+"}}}}";
            console.log(bottomCmd);
            MQTTClient.publish(`server/teensy/${element[0]}/stepper/offset`, bottomCmd);
          }
        });

        neckAngle.forEach((element) => {
          // console.log(element[3]);
          if(bases.includes(element[4])) {
            let neckCmd = "{\"flowerId\":{\""+element[1]+"\":{\"neck\":{\"enable\":true,\"currentCoord1\":"+element[2]+",\"currentCoord2\":"+element[3]+",\"targetCoord1\":"+element[3]+",\"targetCoord2\":"+element[2]+",\"degree\":0,\"speed\":"+134+",\"acc\":"+223+",\"dec\":"+223+"}}}}";
            console.log(neckCmd);
            MQTTClient.publish(`server/teensy/${element[0]}/stepper/coordinate`, neckCmd);
          }
        });
      }
      else if(id=="area") {
        bottamAngle.forEach((element) => {
          let bottomCmd = "{\"flowerId\":{\""+element[1]+"\":{\"bottom\":{\"offset\":"+element[2]+",\"degree\":"+0+",\"speed\":"+7844+",\"acc\":"+26146+",\"dec\":"+26146+"}}}}";
          // console.log(bottomCmd);
          MQTTClient.publish(`server/teensy/${element[0]}/stepper/offset`, bottomCmd);
        });
        await sleep(200);
        neckAngle.forEach((element) => {
          let neckCmd = "{\"flowerId\":{\""+element[1]+"\":{\"neck\":{\"enable\":true,\"currentCoord1\":"+element[2]+",\"currentCoord2\":"+element[3]+",\"targetCoord1\":"+element[3]+",\"targetCoord2\":"+element[2]+",\"degree\":0,\"speed\":"+134+",\"acc\":"+223+",\"dec\":"+223+"}}}}";
          // console.log(neckCmd);
          MQTTClient.publish(`server/teensy/${element[0]}/stepper/coordinate`, neckCmd);
        });

      }
      else if(id=="group") {
        let baseId = req.body.baseId;
        let stepperType = req.body.stepperType;
        console.log(baseId);
        console.log(stepperType);
        const bases = baseId.split(" ");
        console.log(bases);
        
        bottamAngle.forEach((element) => {
          if(bases.includes(element[0])) {
            let bottomCmd = "{\"flowerId\":{\""+element[1]+"\":{\"bottom\":{\"offset\":"+element[2]+",\"degree\":"+0+",\"speed\":"+7844+",\"acc\":"+26146+",\"dec\":"+26146+"}}}}";
            console.log(bottomCmd);
            MQTTClient.publish(`server/teensy/${element[0]}/stepper/offset`, bottomCmd);
          }
        });
        await sleep(200);
        
        neckAngle.forEach((element) => {
          if(bases.includes(element[0])) {
            let neckCmd = "{\"flowerId\":{\""+element[1]+"\":{\"neck\":{\"enable\":true,\"currentCoord1\":"+element[2]+",\"currentCoord2\":"+element[3]+",\"targetCoord1\":"+element[3]+",\"targetCoord2\":"+element[2]+",\"degree\":0,\"speed\":"+134+",\"acc\":"+223+",\"dec\":"+223+"}}}}";
            console.log(neckCmd);
            MQTTClient.publish(`server/teensy/${element[0]}/stepper/coordinate`, neckCmd);
          }
        });
      }
      await sleep(500);

      res.status(200).json(new response(requestCode.ok, 'ok'));
    } catch (error) {
      logging.error(error);
      next(error);
    }
  },

  /**
   * Adjustment
   * @route {GET} /stepper/adjustment/:id
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
  adjustmentPowerBase: async(req, res, next) => {
    try {
      const id = req.params.id;
      console.log(id);
      const i_id = parseInt(id);
      await sleep(500);
      let area = stepperCtrl.findArea(i_id);
      if(area==undefined) throw new AppException(200, requestCode.error, `Can't find area`);

      const bottamAngle = await parseCSV(path.join(process.cwd(), './bottom_angles.csv'));
      const neckAngle = await parseCSV(path.join(process.cwd(), './neck_angles.csv'));

      bottamAngle.forEach((element) => {
        // console.log(element[3]);
        if(area.includes(parseInt(element[0]))) {
          let bottomCmd = "{\"flowerId\":{\""+element[1]+"\":{\"bottom\":{\"offset\":"+element[2]+",\"degree\":"+0+",\"speed\":"+7844+",\"acc\":"+26146+",\"dec\":"+26146+"}}}}";
          console.log(bottomCmd);
          MQTTClient.publish(`server/teensy/${element[0]}/stepper/offset`, bottomCmd);
        }
      });
      await sleep(200);
      neckAngle.forEach((element) => {
        // console.log(element[3]);
        if(area.includes(parseInt(element[0]))) {
          let neckCmd = "{\"flowerId\":{\""+element[1]+"\":{\"neck\":{\"enable\":true,\"currentCoord1\":"+element[2]+",\"currentCoord2\":"+element[3]+",\"targetCoord1\":"+element[3]+",\"targetCoord2\":"+element[2]+",\"degree\":0,\"speed\":"+134+",\"acc\":"+223+",\"dec\":"+223+"}}}}";
          console.log(neckCmd);
          MQTTClient.publish(`server/teensy/${element[0]}/stepper/coordinate`, neckCmd);
        }
      });

      // area.forEach((element) =>{
      //   // console.log(element);
      //   for(let base=1; base<=4; base++){
      //     let cmd = "{\"flowerId\":{\""+base+"\":{\"bottom\":{\"offset\":"+BOTTON_OFFSET[base]+",\"degree\":"+0+",\"speed\":"+7844+",\"acc\":"+26146+",\"dec\":"+26146+"}}}}";
      //     // console.log(cmd);
      //     MQTTClient.publish(`server/teensy/${element}/stepper/offset`, cmd);

      //     let neckCmd = "{\"flowerId\":{\""+base+"\":{\"neck\":{\"enable\":true,\"currentCoord1\":0,\"currentCoord2\":165,\"targetCoord1\":165,\"targetCoord2\":0,\"degree\":0,\"speed\":"+134+",\"acc\":"+223+",\"dec\":"+223+"}}}}";
      //     console.log(neckCmd);
      //     MQTTClient.publish(`server/teensy/${element}/stepper/coordinate`, neckCmd);
      //   }
      // });
      await sleep(500);

      res.status(200).json(new response(requestCode.ok, 'ok'));
    } catch (error) {
      logging.error(error);
      next(error);
    }
  },

  /**
   * Go home
   * @route {GET} /stepper/home/:id
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
  home: async(req, res, next) => {
    try {
      const id = req.params.id;
      console.log(id);
      // const i_id = parseInt(id);
      await sleep(500);

      // 全區域
      if(id==0) {
        console.log("All go home");
        MQTTClient.publish(`server/teensy/broadcast/stepper/home`, `{"flowerId":{"1":{"bottom":{"offset":90}},"2":{"bottom":{"offset":180}},"3":{"bottom":{"offset":0}},"4":{"bottom":{"offset":270}}}}`);
      }
      else if(id==1){
        const bases = req.query.base.split(" ");
        console.log(bases);
        bases.forEach((element) =>{
          MQTTClient.publish(`server/teensy/${element}/stepper/home`, `{"flowerId":{"1":{"bottom":{"offset":90}},"2":{"bottom":{"offset":180}},"3":{"bottom":{"offset":0}},"4":{"bottom":{"offset":270}}}}`);
        });
      }
      else if(id==2){
        // console.log(req.query.flower);
        const flower = req.query.flower.split(" ");
        console.log(flower);
        flower.forEach((element) =>{
          let ff = element%4;
          if(ff==0) ff=4;
          MQTTClient.publish(`server/teensy/group/stepper/home`, `{"teensyId":{"${Math.ceil(element/4)}":{"flowerId":{"${ff}":{"bottom":{"offset":90}}}}}}`);
        });
      }
      
      await sleep(500);

      res.status(200).json(new response(requestCode.ok, 'ok'));
    } catch (error) {
      logging.error(error);
      next(error);
    }
  },

  /**
   * Ctrl angle
   * @route {GET} /stepper/angle/:id
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
  angle: async(req, res, next) => {
    try {
      const id = req.params.id;
      console.log(id);
      // const i_id = parseInt(id);
      await sleep(500);
      console.log(req.body);

      // 全區域
      if(id==2) {
        console.log("Ctrl singel flower");
        const flowers = req.body.target.split(" ");
        console.log(flowers);
        
        if(!("bottom" in req.body) && !("neck" in req.body)) throw new AppException(500, requestCode.error, `Angle error`);
        

        flowers.forEach((element) =>{
          let cmd = {};
          let flowerId = {};
          let angleCmd = {};
          let base = Math.floor(element/4)+1;
          let fid = element%4;
          if("bottom" in req.body){
            console.log("bottom");
            angleCmd["bottom"] = bottomAngle(req.body.bottom);
            // flowerId[fid]["bottom"] = bottomAngle(req.body.bottom);
          }
          if("neck" in req.body){
            console.log("neck");
            angleCmd["neck"] = neckAngle(req.body.neck);
            // flowerId[fid]["neck"] = neckAngle(req.body.neck);
          }
          flowerId[fid] = angleCmd;
          cmd["flowerId"] = flowerId;
          console.log(JSON.stringify(cmd));
          // MQTTClient.publish(`server/teensy/${element}/stepper/home`, `{"flowerId":{"1":{"bottom":{"offset":90}},"2":{"bottom":{"offset":180}},"3":{"bottom":{"offset":0}},"4":{"bottom":{"offset":270}}}}`);
        });
        
        
        // MQTTClient.publish(`server/teensy/broadcast/stepper/home`, `{"flowerId":{"1":{"bottom":{"offset":90}},"2":{"bottom":{"offset":180}},"3":{"bottom":{"offset":0}},"4":{"bottom":{"offset":270}}}}`);
      }
      else if(id==1){
        // const bases = req.query.base.split(" ");
        // console.log(bases);
        // bases.forEach((element) =>{
        //   MQTTClient.publish(`server/teensy/${element}/stepper/home`, `{"flowerId":{"1":{"bottom":{"offset":90}},"2":{"bottom":{"offset":180}},"3":{"bottom":{"offset":0}},"4":{"bottom":{"offset":270}}}}`);
        // });
      }
      
      await sleep(500);

      res.status(200).json(new response(requestCode.ok, 'ok'));
    } catch (error) {
      logging.error(error);
      next(error);
    }
  },

};

const bottomAngle = (angle) => {
  return {
    "degree": angle,
    "speed" : 7844,
    "acc"   : 26146,
    "dec"   : 26146
  }
}

const neckAngle = (angle) => {
  return {
    "degree": angle,
    "speed" : 134,
    "acc"   : 223,
    "dec"   : 223
  }
}

// const bottomAngle = (angle) => {
//   return {
//     "bottom": {
//         "degree": angle,
//         "speed" : 7844,
//         "acc"   : 26146,
//         "dec"   : 26146
//       }
//   }
// }

// const neckAngle = (angle) => {
//   return {
//     "neck": {
//         "degree": angle,
//         "speed" : 134,
//         "acc"   : 223,
//         "dec"   : 223
//       }
//   }
// }

module.exports = stepperService;
