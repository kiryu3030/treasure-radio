const app = require('./app/app.js');
const logger = require('./app/config/log.config.js');
const { createServer } = require("http");
const { Server } = require("socket.io");

const logging = logger(__filename);

// const mainApp = createServer(app);
// const io = new Server(mainApp, {cors: {origin: "*" }});

// import WebSocket from './routes/websocket/websocket-event.js';
// const WebSocket = require('./app/routes/websocket/websocket-event.js');
// WebSocket.init(io);
// WebSocket.mountEvent();

const PORT = 8083;
app.listen(PORT, () => {
  logging.info(`WebServer is running on port ${PORT}`)
})
