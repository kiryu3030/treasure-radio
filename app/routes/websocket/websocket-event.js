// import logger from '../../config/log.config.js';
// import { Server } from 'socket.io';

const logger = require('../../config/log.config.js');
const { Server } = require("socket.io");
const Message = require('../message/msg.model.js');

const logging = logger(__filename);

const WebSocket = {
  /** @type {Server} */
  io: undefined,

  init: (io) => {
    WebSocket.io = io;
  },

  mountEvent: () => {
    WebSocket.io.on('connection', async (socket) => {
      logging.info(`User:${socket.id} connected`);

      try {
        let msgs = await Message.find({}).limit(1).sort({date: -1}).exec();
        if(msgs==undefined) throw new AppException(204, requestCode.db_query_error, `Can't get msgs`);
        logging.info(`audio_path_auto:${msgs[0].audio_path}`);
        WebSocket.io.to(socket.id).emit('play_audio', {'path': msgs[0].audio_path})
        
      } catch (error) {
        logging.error(error);
      }
  
      socket.on('disconnect', () => {
        logging.info(`user:${socket.id} disconnected`);
      });

      socket.on('play_audio', async(msg) => {
        logging.info(`audio_path:${msg.path}`);
        WebSocket.io.emit('play_audio', msg);
      });
    });
  },

  articleEvent: async (msg) => {
    WebSocket.io.emit('article', msg)
  },

  audioPythonPlayEvent: async (msg) => {
    logging.info(`audio_path:${msg.path}`);
    WebSocket.io.emit('play_audio', msg)
  },

  audioWebEvent: async (msg) => {
    WebSocket.io.emit('audio', msg)
  },

  sendTestEvent: async (msg) => {
    WebSocket.io.emit('image', msg)
  },

  sendSelfStateEvent: async (socketId, msg) => {
    WebSocket.io.to(socketId).emit('self_state_respones', msg)
  }

};

// export default WebSocket;
module.exports = WebSocket;
