const express = require('express');

const htmlRoute = require('./html/html.routes.js');
const powerRoute = require('./power/power.routes.js');
const stepperRoute = require('./stepper/stepper.routes.js');
const msgRoute = require('./message/msg.routes.js');

const checkDBAndMQTT = require( '../middleware/check-db-mqtt.js');

const api = express.Router()
  .use(checkDBAndMQTT)
  .use(msgRoute);

const apiRoute = express.Router().use('/api', api);

module.exports = { apiRoute, htmlRoute };
