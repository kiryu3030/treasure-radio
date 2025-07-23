const { apiRoute, htmlRoute } = require('./routes/routes.js');
const errorHandler = require('./middleware/error-handler.js');

// import lightService from './routes/light/light.service.js';

const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");

// const mongoose = require("mongoose");
// const connectDB = require('./database/database.js');

const app = express();

// connectDB();

app.use(cors());
app.use(express.json());

app.use('/static', express.static(path.join(__dirname, 'static')));

app.use(apiRoute);
app.use(htmlRoute);

app.use(errorHandler);

// const mainApp = createServer(app);
// const io = new Server(mainApp, {cors: {origin: "*" }});

// import WebSocket from './routes/websocket/websocket-event.js';
// WebSocket.init(io);
// WebSocket.mountEvent();

// export default mainApp;
// module.exports = mainApp;
module.exports = app;
