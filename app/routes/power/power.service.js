const express = require('express');
const logger = require('../../config/log.config');
const response = require('../../utilities/response.js');
const requestCode = require('../../utilities/response-code.js');
const AppException = require('../../utilities/app-exception.js');
const UDPClient = require('../udp/udp-client.js');
const { sleep } = require('../../utilities/utils.js');
const { powerPrepareCMD, powerCMD, powerChannelCMD } = require('../../utilities/powerCMD.js');
const MQTTClient = require('../mqtt/mqtt-client.js');

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

const POWER_CMD = {
  "ALL_ON":"0",
  "ALL_OFF":"1",
  "R_ON":"2",
  "R_OFF":"3",
  "S_ON":"4",
  "S_OFF":"5",
  "T_ON":"6",
  "T_OFF":"7",
  "BASE_ON":"8",
  "BASE_OFF":"9",
}

const LED_CMD = {
  "LED_ON":"0",
  "LED_OFF":"1",
}

const handshakeCMD = Buffer.from('55aa010005', 'hex');

const r_on_pre = new powerPrepareCMD(1, 1).buf;
const r_on = new powerCMD(1, 1).buf;
const s_on_pre = new powerPrepareCMD(2, 1).buf;
const s_on = new powerCMD(2, 1).buf;
const t_on_pre = new powerPrepareCMD(3, 1).buf;
const t_on = new powerCMD(3, 1).buf;

const r_off_pre = new powerPrepareCMD(1, 0).buf;
const r_off = new powerCMD(1, 0).buf;
const s_off_pre = new powerPrepareCMD(2, 0).buf;
const s_off = new powerCMD(2, 0).buf;
const t_off_pre = new powerPrepareCMD(3, 0).buf;
const t_off = new powerCMD(3, 0).buf;

const powerCtrl = {
  r_on: async() => {
    UDPClient.send(r_on_pre);
    await sleep(500);
    UDPClient.send(r_on);
    await sleep(500);
  },

  r_off: async() => {
    UDPClient.send(r_off_pre);
    await sleep(500);
    UDPClient.send(r_off);
    await sleep(500);
  },

  s_on: async() => {
    UDPClient.send(s_on_pre);
    await sleep(500);
    UDPClient.send(s_on);
    await sleep(500);
  },

  s_off: async() => {
    UDPClient.send(s_off_pre);
    await sleep(500);
    UDPClient.send(s_off);
    await sleep(500);
  },

  t_on: async() => {
    UDPClient.send(t_on_pre);
    await sleep(500);
    UDPClient.send(t_on);
    await sleep(500);
  },

  t_off: async() => {
    UDPClient.send(t_off_pre);
    await sleep(500);
    UDPClient.send(t_off);
    await sleep(500);
  },

  findArea: (base) => {
    for (const [key, value] of Object.entries(POWER_AREA)){
      if(value.includes(base)){
        console.log(key, value);
        return key;
      }
    }
  },
}

const powerService = {
  /**
   * Power control
   * @route {GET} /power/:id
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
  power: async(req, res, next) => {
    try {
      const id = req.params.id;
      // console.log(id);

      UDPClient.send(handshakeCMD);
      await sleep(500);

      switch (id) {
        case POWER_CMD.ALL_ON:
          console.log('ALL_ON');
          // logging.info("r srat");
          await powerCtrl.r_on();
          // logging.info("r end");
          // logging.info("s srat");
          await powerCtrl.s_on();
          // logging.info("s end");
          // logging.info("t srat");
          await powerCtrl.t_on();
          await sleep(7500);
          // logging.info("t end");
          break;
        case POWER_CMD.ALL_OFF:
          console.log('ALL_OFF');
          await powerCtrl.r_off();
          await powerCtrl.s_off();
          await powerCtrl.t_off();
          await sleep(7500);
          break;
        case POWER_CMD.R_ON:
          console.log('R_ON');
          await powerCtrl.r_on();
          break;
        case POWER_CMD.R_OFF:
          console.log('R_OFF');
          await powerCtrl.r_off();
          break;
        case POWER_CMD.S_ON:
          console.log('S_ON');
          await powerCtrl.s_on();
          break;
        case POWER_CMD.S_OFF:
          console.log('S_OFF');
          await powerCtrl.s_off();
          break;
        case POWER_CMD.T_ON:
          console.log('T_ON');
          await powerCtrl.t_on();
          break;
        case POWER_CMD.T_OFF:
          console.log('T_OFF');
          await powerCtrl.t_off();
          break;
        case POWER_CMD.BASE_ON:{
            console.log('BASE_ON');
            const base = parseInt(req.query.base);
            let area = powerCtrl.findArea(base);
            console.log(base);
            console.log(area);
            let powerId = area.split("-")[0];
            let ch = area.split("-")[1];

            UDPClient.send(handshakeCMD);
            await sleep(500);

            const cmdCH = new powerChannelCMD(powerId, ch, 2).buf;
            UDPClient.send(cmdCH);
            await sleep(500);
            break;
          }
          
        case POWER_CMD.BASE_OFF:
          console.log('BASE_OFF');
          const base = parseInt(req.query.base);
          let area = powerCtrl.findArea(base);
          console.log(base);
          console.log(area);
          let powerId = area.split("-")[0];
          let ch = area.split("-")[1];
          
          UDPClient.send(handshakeCMD);
          await sleep(500);

          const cmdCH = new powerChannelCMD(powerId, ch, 1).buf;
          UDPClient.send(cmdCH);
          await sleep(500);
          break;
        default:
          console.log(`No id: ${id}`);
          throw new AppException(200, requestCode.error, `Can't paser`);
      }

      await sleep(1000);
      res.status(200).json(new response(requestCode.ok, 'ok'));
    } catch (error) {
      logging.error(error);
      next(error);
    }
  },

    /**
   * Power channel control
   * @route {GET} /power/:id
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
    powerCH: async(req, res, next) => {
      try {
        const id = req.params.id;
        const ch = req.query.ch;
        const mode = req.query.mode;
        console.log(id);
        console.log(ch);
        console.log(mode);
  
        UDPClient.send(handshakeCMD);
        await sleep(500);

        const cmdCH = new powerChannelCMD(id, ch, mode).buf;
        UDPClient.send(cmdCH);
        await sleep(500);
  
        res.status(200).json(new response(requestCode.ok, 'ok'));
      } catch (error) {
        logging.error(error);
        next(error);
      }
    },

  /**
   * LED control
   * @route {GET} /led/:id
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
  led: async(req, res, next) => {
    try {
      const id = req.params.id;
      console.log(id);

      await sleep(600);

      switch (id) {
        case LED_CMD.LED_ON:
          console.log('LED_ON');
          MQTTClient.publish("server/teensy/broadcast/system/ledoutput", '{"output": true}')
          break;
        case LED_CMD.LED_OFF:
          console.log('LED_OFF');
          MQTTClient.publish("server/teensy/broadcast/system/ledoutput", '{"output": false}')
          break;
        default:
          console.log(`No id: ${id}`);
          throw new AppException(200, requestCode.error, `Can't paser`);
      }

      res.status(200).json(new response(requestCode.ok, 'ok'));
    } catch (error) {
      logging.error(error);
      next(error);
    }
  },

  /**
   * LED display
   * @route {GET} /led/display/:id
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
  ledDisplay: async(req, res, next) => {
    try {
      // const id = req.params.id;
      const r = req.query.r;
      const g = req.query.g;
      const b = req.query.b;
      console.log(req.params.id);
      // console.log(r);
      // console.log(g);
      // console.log(b);

      await sleep(600);

      const flower =  req.params.id.split(" ");
      flower.forEach((element) =>{
        let ff = element%4;
        if(ff==0) ff=4;
        // if(ff==1){
        //   ff = 3;
        // }
        // else if(ff==2){
        //   ff = 2;
        // }
        // else if(ff==3){
        //   ff = 4;
        // }
        // else if(ff==4){
        //   ff = 1;
        // }
        MQTTClient.publish(`server/teensy/${Math.ceil(element/4)}/system/ledcolor`,  `{"flowerId":{"${ff}":{"r":${r},"g":${g},"b":${b}}}}`);
      });

      res.status(200).json(new response(requestCode.ok, 'ok'));
    } catch (error) {
      logging.error(error);
      next(error);
    }
  },
};

module.exports = powerService;
