const app = require('./app/app.js');
const logger = require('./app/config/log.config.js');
const { createServer } = require("http");
const { Server } = require("socket.io");

const logging = logger(__filename);

const mongoose = require("mongoose");
const connectDB = require('./app/database/database.js');

connectDB();

const mainApp = createServer(app);
const io = new Server(mainApp, {cors: {origin: "*" }});

const WebSocket = require('./app/routes/websocket/websocket-event.js');
WebSocket.init(io);
WebSocket.mountEvent();

const PORT = 8082;
mainApp.listen(PORT, () => {
  logging.info(`WebServer is running on port ${PORT}`)
})
