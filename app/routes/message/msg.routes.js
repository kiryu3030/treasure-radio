const express = require("express");
const msgService = require("./msg.service.js");

const msgRoute = express.Router();

msgRoute.post('/message/insert', msgService.insert);
msgRoute.get('/message/last', msgService.lastArticle);
msgRoute.get('/messages', msgService.allArticle);
msgRoute.get('/message/ping', msgService.ping);

module.exports = msgRoute;
