// import logger from '../../config/log.config.js';
// import { Server } from 'socket.io';

const logger = require('../../config/log.config.js');
const { Server } = require("socket.io");

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
  
      socket.on('disconnect', () => {
        logging.info(`user:${socket.id} disconnected`);
      });
    });
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
