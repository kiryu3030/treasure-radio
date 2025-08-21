const express = require("express");
const msgService = require("./msg.service.js");

const msgRoute = express.Router();

msgRoute.post('/message/insert', msgService.insert);
msgRoute.get('/message/last', msgService.lastArticle);

module.exports = msgRoute;
