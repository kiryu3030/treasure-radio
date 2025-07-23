const express = require("express");
const lightService = require("./light.service.js");

const lightRoute = express.Router();

lightRoute.get('/lights', lightService.lightSetting);

module.exports = lightRoute;
