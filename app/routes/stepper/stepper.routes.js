const express = require("express");
const stepperService = require("./stepper.service.js");

const stepperRoute = express.Router();

stepperRoute.post('/stepper/adjustment/:id', stepperService.adjustment);
stepperRoute.get('/stepper/adjustment/power/:id', stepperService.adjustmentPowerBase);
stepperRoute.get('/stepper/home/:id', stepperService.home);
stepperRoute.post('/stepper/angle/:id', stepperService.angle);

module.exports = stepperRoute;
