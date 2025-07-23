const express = require("express");
const powerService = require("./power.service.js");

const powerRoute = express.Router();

powerRoute.get('/power/ch/:id', powerService.powerCH);
powerRoute.get('/power/:id', powerService.power);
powerRoute.get('/led/:id', powerService.led);
powerRoute.get('/led/display/:id', powerService.ledDisplay);

module.exports = powerRoute;
