const express = require('express');
const OpenAI = require('openai');
const logger = require('../../config/log.config');
const { nowTimeFormat, utcTimeFormat, nowAudioFileTimeFormat } = require('../../utilities/time-format.js');
const response = require('../../utilities/response.js');
const requestCode = require('../../utilities/response-code.js');
const AppException = require('../../utilities/app-exception.js');
const config = require('../../config/config.js');
const YatingClient = require('../tts/yating-client.js');
const WebSocket = require('../websocket/websocket-event.js');
const Message = require('./msg.model.js');
const path = require('path');
const { execFile } = require('child_process');

const logging = logger(__filename);

const openai = new OpenAI({
  apiKey: config.chatgpt
});

const yatingClient = new YatingClient('https://tts.api.yating.tw/v2/speeches/short', config.yating);

let articleLenMin = 190;
let articleLenMax = 160;
const selectSnow = ['新聞快訊', '命理占卜', '詩集閱讀', '聽眾信箱'];

// let sortArray = ['a', 'b', 'c', 'd'];
function shuffle(array){
//   set the index to the arrays length
  let i = array.length, j, temp;
//   create a loop that subtracts everytime it iterates through
  while (--i > 0) {
//  create a random number and store it in a variable
  j = Math.floor(Math.random () * (i+1));
// create a temporary position from the item of the random number    
  temp = array[j];
// swap the temp with the position of the last item in the array    
  array[j] = array[i];
// swap the last item with the position of the random number 
  array[i] = temp;
  }
// return[execute] the array when it completes::don't really need the console.log but helps to check
  console.log(array);
}

function isSafeHost(host) {
  // hostname: a-z, 0-9, . 和 -；IPv4: 數字與點
  return /^[a-zA-Z0-9.-]+$/.test(host);
}

const messageService = {
  
   /**
   * Insert a car
   * @route {POST} /car
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
    insert: async(req, res, next) => {
      // 40 秒後自動中斷chatgpt api
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 40000);

      try {
        const { name, age, wish, select, device } = req.body;
        console.log(name);
        console.log(age);
        console.log(wish);
        console.log(select);
        console.log(device);

        let msgs = await Message.find({}).limit(2).sort({date: -1}).exec();
        if(msgs==undefined) throw new AppException(204, requestCode.db_query_error, `Can't get msgs`);
        shuffle(msgs);
        console.log(msgs);

        let wishs = `"${wish}"、`;
        let names = `"${name}"、`;
        for(let i=0; i<msgs.length; i++){
          wishs += `"${msgs[i]['wish']}"${i==msgs.length-1 ? "，" : "、"}`;
          names += `"${msgs[i]['name']}"${i==msgs.length-1 ? "" : "、"}`;
          // articleLenMin += 10;
        }

        console.log(wishs);
        console.log(names);

        // return res.status(200).json(new response(requestCode.ok, 'done'));
        
        if(device=='主裝置' && selectSnow.includes(select)){
          config.defaultSelect = select;
        }
        logging.info(`${device}:${config.defaultSelect}`);

        // ---生成文章---
        logging.info(`${device}:Article...`);
        let systemRole = undefined;
        let userRole = undefined;
        // userRole = `"${wish}"目前有${1}段話，和${1}個角色分別叫"${name}"，角色名稱可以用相近的暱稱代替，請你以新聞主播的觀點幫我寫一段大約${articleLenMin}字到${articleLenMax}字之間的故事，如果有意義不明或看不懂的句子可以忽略，用繁體中文回答，回傳給我的時候只要故事內容就好`
        switch (config.defaultSelect) {
          case '新聞快訊':
            systemRole = "你是一位新聞主播";
            userRole = `${wishs}目前有這${msgs.length+1}段話，和${msgs.length+1}個角色分別叫${names}，這些角色名稱可以用相近的暱稱代替，請你以新聞主播的觀點幫我寫一段${articleLenMin}字的故事，如果有意義不明或看不懂的句子可以忽略，用繁體中文回答，回傳給我的時候只要故事內容就好且不要出現引號`
            break;
          case '命理占卜':
            systemRole = "你是一位對星座、塔羅很擅長的占卜師";
            userRole = `${wishs}目前有這${msgs.length+1}段話，和${msgs.length+1}個角色分別叫${names}，這些角色名稱可以用相近的暱稱代替，請你以命理占卜的觀點幫我寫一段${articleLenMin}字的故事，如果有意義不明或看不懂的句子可以忽略，用繁體中文回答，回傳給我的時候只要故事內容就好且不要出現引號`
            break;
          case '詩集閱讀':
            systemRole = "你是一位喜歡文學、詩歌、美學的作家";
            userRole = `${wishs}目前有這${msgs.length+1}段話，和${msgs.length+1}個角色分別叫${names}，這些角色名稱可以用相近的暱稱代替，請你以作家的觀點幫我寫一段${articleLenMin}字的故事，如果有意義不明或看不懂的句子可以忽略，用繁體中文回答，回傳給我的時候只要故事內容就好且不要出現引號`
            break;
          case '聽眾信箱':
            systemRole = "你是一位喜歡分享和傾聽別人故事的廣播主持人";
            userRole = `${wishs}目前有這${msgs.length+1}段話，和${msgs.length+1}個角色分別叫${names}，這些角色名稱可以用相近的暱稱代替，請你以廣播主持人的觀點幫我寫一段${articleLenMin}字的故事，如果有意義不明或看不懂的句子可以忽略，用繁體中文回答，回傳給我的時候只要故事內容就好且不要出現引號`
            break;
          default:
            systemRole = "你是一位新聞主播";
            userRole = `${wishs}目前有這${msgs.length+1}段話，和${msgs.length+1}個角色分別叫${names}，這些角色名稱可以用相近的暱稱代替，請你以新聞主播的觀點幫我寫一段${articleLenMin}字的故事，如果有意義不明或看不懂的句子可以忽略，用繁體中文回答，回傳給我的時候只要故事內容就好且不要出現引號`
        }
        logging.info(userRole);
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: `${systemRole}` },
            { role: "user", content: `${userRole}` }
          ]
        },
        {
          signal: controller.signal // timeout
        });
        let article = completion.choices[0].message.content;
        console.log(article);
        WebSocket.articleEvent({'article': `您現在收聽的是《鳴唱電台》一切美好都會實現，${article.replace(/(\r\n|\r|\n)+/g, ' ').trim()}`, 'select': config.defaultSelect});
        logging.info(`${device}:Article done`);
        // WebSocket.articleEvent('在一個平靜的周末早晨，張獲得了一個意想不到的驚喜。他在整理舊發票時，偶然發現自己中獎了，那是一張價值2000萬的發票。對於一個普通上班族來說，這簡直是天上掉下來的禮物。張哭笑不得，回想起過去節省每一分錢的日子。他一邊幻想著退休後的悠閒生活，一邊思考著應該如何合理運用這筆意外之財。張決定成立一個公益基金，幫助需要幫助的人，因為他深知，改變命運的除了幸運，更需要善良的心。這不僅是人生的轉折點，更是對每個人心靈的一次洗禮。');
        // ---生成文章---

        // ---文字轉語音---
        // yatingClient 你好，這是一段測試語音。 .replace(/[，。、；]/g, '') 1.15
        let inputText = article.replace(/(\r\n|\r|\n)+/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(inputText.slice(0, 270));
        logging.info(`${device}:Audio...`);
        const outPath = await yatingClient.synthesize(
          `您現在收聽的是《鳴唱電台》一切美好都會實現${inputText.slice(0, 270)}`,
          YatingClient.TYPE_TEXT,
          YatingClient.MODEL_ZHEN_MALE_1,
          1.01, 1.0, 1.0,
          YatingClient.ENCODING_LINEAR16,
          YatingClient.SAMPLE_RATE_16K,
          `${nowAudioFileTimeFormat()}`.replace(/[:]/g, '-'),
          { timeoutMs: 70_000 } // ← axios timeout 設 60 秒
        );
        logging.info(`${device}:Audio done: ${outPath}`);
        WebSocket.audioPythonPlayEvent({ path: `${outPath}` });
        WebSocket.audioWebEvent({'path': outPath, 'select': config.defaultSelect});
        // ---文字轉語音---

        // ---save data---
        const msg = new Message({
          name: name,
          age: age,
          wish: wish,
          select: config.defaultSelect,
          device: device,
          article: article,
          audio_path: outPath,
          date: utcTimeFormat(),
        })
        await msg.save()
        // ---save data---

        return res.status(200).json(new response(requestCode.ok, 'done'));
  
        // const car = new Car({
        //   name: name,
        //   date: timeFormat(),
        //   ip:{
        //     z: ip.z
        //   },
        //   steeringWheel: {
        //     angle: steeringWheel.angle,
        //     vector: steeringWheel.vector,
        //     y: steeringWheel.y
        //   },
        //   firstSeat: {
        //     x: firstSeat.x,
        //     y: firstSeat.y,
        //     z: firstSeat.z
        //   },
        //   firstSeatSlave: {
        //     x: firstSeatSlave.x,
        //     y: firstSeatSlave.y,
        //     z: firstSeatSlave.z
        //   },
        //   secondSeat: {
        //     x: secondSeat.x,
        //     y: secondSeat.y,
        //     z: secondSeat.z
        //   },
        //   thirdSeat: {
        //     x: thirdSeat.x,
        //     y: thirdSeat.y,
        //     z: thirdSeat.z
        //   }
        // })
        // await car.save()
  
        // const cars = await Car.find({}).select(
        //   '-date -__v -ip._id -ip.__v -steeringWheel._id -steeringWheel.__v -firstSeat._id -firstSeat.__v -secondSeat._id -secondSeat.__v -thirdSeat._id -thirdSeat.__v'
        // ).limit(30).sort({date: 1}).exec();
        // if(cars==undefined) throw new AppException(404, requestCode.db_query_error, `Can't get cars`);
        // let lastPosIndex = 0;
        // for(let i=0; i<cars.length; i++) {
        //   if(cars[i].name=='lastPos') lastPosIndex = i;
        // }
        // cars.splice(lastPosIndex, 1);
        
        // res.status(200).json(new response(requestCode.ok, cars));
      } catch (error) {
        logging.error(error);
        next(error);
      } finally {
        // console.log('finally timeout');
        clearTimeout(timeout); // 清除計時器
      }
    },

    /**
   * Insert a car
   * @route {POST} /car
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
    insertSmall: async(req, res, next) => {
      // 40 秒後自動中斷chatgpt api
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 40000);

      try {
        const { name, age, wish, device } = req.body;
        console.log(name);
        console.log(age);
        console.log(wish);
        console.log(device);

        // let select = await Message.find({device:'主裝置'}).limit(1).sort({date: -1}).exec();
        // if(select==undefined) throw new AppException(204, requestCode.db_query_error, `Can't get select msgs`);
        // console.log(select[0]['select']);

        let msgs = await Message.find({}).limit(2).sort({date: -1}).exec();
        if(msgs==undefined) throw new AppException(204, requestCode.db_query_error, `Can't get msgs`);
        shuffle(msgs);
        console.log(msgs);

        let wishs = `"${wish}"、`;
        let names = `"${name}"、`;
        for(let i=0; i<msgs.length; i++){
          wishs += `"${msgs[i]['wish']}"${i==msgs.length-1 ? "，" : "、"}`;
          names += `"${msgs[i]['name']}"${i==msgs.length-1 ? "" : "、"}`;
          // articleLenMin += 10;
        }

        console.log(wishs);
        console.log(names);

        logging.info(`${device}:${config.defaultSelect}`);

        // ---生成文章---
        logging.info(`${device}:Article...`);
        let systemRole = undefined;
        let userRole = undefined;
        // userRole = `"${wish}"目前有${1}段話，和${1}個角色分別叫"${name}"，角色名稱可以用相近的暱稱代替，請你以新聞主播的觀點幫我寫一段大約${articleLenMin}字到${articleLenMax}字之間的故事，如果有意義不明或看不懂的句子可以忽略，用繁體中文回答，回傳給我的時候只要故事內容就好`
        switch (config.defaultSelect) {
          case '新聞快訊':
            systemRole = "你是一位新聞主播";
            userRole = `${wishs}目前有這${msgs.length+1}段話，和${msgs.length+1}個角色分別叫${names}，這些角色名稱可以用相近的暱稱代替，請你以新聞主播的觀點幫我寫一段大約${articleLenMin}字的故事，如果有意義不明或看不懂的句子可以忽略，用繁體中文回答，回傳給我的時候只要故事內容就好且不要出現引號`
            break;
          case '命理占卜':
            systemRole = "你是一位對星座、塔羅很擅長的占卜師";
            userRole = `${wishs}目前有這${msgs.length+1}段話，和${msgs.length+1}個角色分別叫${names}，這些角色名稱可以用相近的暱稱代替，請你以命理占卜的觀點幫我寫一段大約${articleLenMin}字的故事，如果有意義不明或看不懂的句子可以忽略，用繁體中文回答，回傳給我的時候只要故事內容就好且不要出現引號`
            break;
          case '詩集閱讀':
            systemRole = "你是一位喜歡文學、詩歌、美學的作家";
            userRole = `${wishs}目前有這${msgs.length+1}段話，和${msgs.length+1}個角色分別叫${names}，這些角色名稱可以用相近的暱稱代替，請你以作家的觀點幫我寫一段大約${articleLenMin}字的故事，如果有意義不明或看不懂的句子可以忽略，用繁體中文回答，回傳給我的時候只要故事內容就好且不要出現引號`
            break;
          case '聽眾信箱':
            systemRole = "你是一位喜歡分享和傾聽別人故事的廣播主持人";
            userRole = `${wishs}目前有這${msgs.length+1}段話，和${msgs.length+1}個角色分別叫${names}，這些角色名稱可以用相近的暱稱代替，請你以廣播主持人的觀點幫我寫一段大約${articleLenMin}字的故事，如果有意義不明或看不懂的句子可以忽略，用繁體中文回答，回傳給我的時候只要故事內容就好且不要出現引號`
            break;
          default:
            systemRole = "你是一位新聞主播";
            userRole = `${wishs}目前有這${msgs.length+1}段話，和${msgs.length+1}個角色分別叫${names}，這些角色名稱可以用相近的暱稱代替，請你以新聞主播的觀點幫我寫一段大約${articleLenMin}字的故事，如果有意義不明或看不懂的句子可以忽略，用繁體中文回答，回傳給我的時候只要故事內容就好且不要出現引號`
        }
        console.log(userRole);
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: `${systemRole}` },
            { role: "user", content: `${userRole}` }
          ]
        },
        {
          signal: controller.signal // timeout
        });
        let article = completion.choices[0].message.content;
        console.log(article);
        WebSocket.articleEvent({'article': article, 'select': config.defaultSelect});
        logging.info(`${device}:Article done`);
        // WebSocket.articleEvent('在一個平靜的周末早晨，張獲得了一個意想不到的驚喜。他在整理舊發票時，偶然發現自己中獎了，那是一張價值2000萬的發票。對於一個普通上班族來說，這簡直是天上掉下來的禮物。張哭笑不得，回想起過去節省每一分錢的日子。他一邊幻想著退休後的悠閒生活，一邊思考著應該如何合理運用這筆意外之財。張決定成立一個公益基金，幫助需要幫助的人，因為他深知，改變命運的除了幸運，更需要善良的心。這不僅是人生的轉折點，更是對每個人心靈的一次洗禮。');
        // ---生成文章---

        // ---文字轉語音---
        // yatingClient 你好，這是一段測試語音。
        let inputText = article.replace(/(\r\n|\r|\n)+/g, ' ').replace(/[，。、；]/g, '').replace(/\s+/g, ' ').trim();
        console.log(inputText.slice(0, 270));
        logging.info(`${device}:Audio...`);
        const outPath = await yatingClient.synthesize(
          `您現在收聽的是《鳴唱電台》一切美好都會實現${inputText.slice(0, 270)}`,
          YatingClient.TYPE_TEXT,
          YatingClient.MODEL_ZHEN_MALE_1,
          1.15, 1.0, 1.0,
          YatingClient.ENCODING_LINEAR16,
          YatingClient.SAMPLE_RATE_16K,
          `${nowTimeFormat()}`.replace(/[:]/g, '-'),
          { timeoutMs: 70_000 } // ← axios timeout 設 60 秒
        );
        logging.info(`${device}:Audio done: ${outPath}`);
        WebSocket.audioPythonPlayEvent({ path: `${outPath}` });
        WebSocket.audioWebEvent({'path': outPath, 'select': config.defaultSelect});
        // ---文字轉語音---

        // ---save data---
        const msg = new Message({
          name: name,
          age: age,
          wish: wish,
          select: config.defaultSelect,
          device: device,
          article: article,
          audio_path: outPath,
          date: utcTimeFormat(),
        })
        await msg.save()
        // ---save data---

        return res.status(200).json(new response(requestCode.ok, 'done'));
      } catch (error) {
        logging.error(error);
        next(error);
      } finally {
        // console.log('finally timeout');
        clearTimeout(timeout); // 清除計時器
      }
    },

     /**
   * Gat last msg
   * @route {GET} /message/last
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
     lastArticle: async(req, res, next) => {
      try {
        let msgs = await Message.find({}).limit(1).sort({date: -1}).exec();
        if(msgs==undefined) throw new AppException(204, requestCode.db_query_error, `Can't get msgs`);
        console.log(msgs);

        return res.status(200).json(new response(requestCode.ok, {'article': msgs[0].article, 'select': msgs[0].select}));
      } catch (error) {
        logging.error(error);
        next(error);
      }
    },

      /**
   * Gat all msg
   * @route {GET} /message/all
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
      allArticle: async(req, res, next) => {
        try {
          let msgs = await Message.find({}).select(
            '-article -audio_path -__v'
          ).sort({date: -1}).exec();
          if(msgs==undefined) throw new AppException(204, requestCode.db_query_error, `Can't get msgs`);
          // console.log(msgs);
  
          return res.status(200).json(new response(requestCode.ok, msgs));
        } catch (error) {
          logging.error(error);
          next(error);
        }
      },

        /**
     * Gat all msg
     * @route {GET} /message/ping
     * @param {express.Request} req 
     * @param {express.Response} res 
     * @param {express.NextFunction} next 
     */
      ping: async(req, res, next) => {
        try {
          const host = (req.query.host || '').trim();

          if (!host || !isSafeHost(host)) throw new AppException(400, requestCode.error, `Host error`);
          const isWin = process.platform === 'win32';
          const cmd = isWin ? 'ping' : 'ping';
          const args = isWin ? ['-n', '3', '-w', '2000', host] : ['-c', '3', '-W', '2', host];

          execFile(cmd, args, { timeout: 5000 }, (err, stdout = '', stderr = '') => {
            const out = String(stdout || '') + String(stderr || '');
            // const out = stdout;
            // 解析 time=...ms
            logging.info(out);
            const m = out.match(/time[=<]?\s*([0-9.]+)\s*ms/i);
            logging.info(m);
            const rtt = m ? parseFloat(m[1]) : null;
            logging.info(rtt);
        
            // Windows 成功通常會有 "TTL="；Unix 成功通常會有 "1 packets received" 或 " 0% packet loss"
            const reachable = /TTL=|ttl=|[1-9]\s+received|[0-9.]+%\s*packet loss/i.test(out) && !/100%\s*packet loss/i.test(out);
        
            // 某些環境失敗 err 會非空，但我們仍回傳 raw 以利除錯
            // res.json();
            return res.status(200).json(new response(requestCode.ok, {
              host,
              reachable: Boolean(reachable && rtt !== null) || (!err && rtt !== null),
              rtt_ms: rtt,
              raw: out
            }));
          });
  
          
        } catch (error) {
          logging.error(error);
          next(error);
        }
      },
};

module.exports = messageService;
