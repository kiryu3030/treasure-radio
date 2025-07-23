const express = require('express');
const mongoose = require("mongoose");

const AppException = require('../utilities/app-exception.js');
const requestCode = require('../utilities/response-code.js');

const logger = require('../config/log.config.js');

const logging = logger(__filename);

const ConnectionStates = {
  disconnected: 0,
  connected: 1,
  connecting: 2,
  disconnecting: 3,
  uninitialized: 99,
}

/**
   * 
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   * @returns 
   */
const checkDBAndMQTT = (req, res, next) => {
  try{
    if(mongoose.connection.readyState!=ConnectionStates.connected){
      throw new AppException(500, requestCode.db_error, `DB not ready or disconnected. State:${mongoose.connection.readyState}`);
    }
    else next();
  }
  catch(error){
    logging.error(error);
    next(error);
  }
};

module.exports = checkDBAndMQTT;
