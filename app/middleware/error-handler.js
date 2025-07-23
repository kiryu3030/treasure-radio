const express = require('express');

const AppException = require('../utilities/app-exception.js');
const response = require('../utilities/response.js');
const requestCode = require('../utilities/response-code.js');

/**
   * 
   * @param {AppException} err 
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   * @returns 
   */
const errorHandler = (err, req, res, next) => {
  if(err && err.httpErrorCode && err.appErrorCode){
    res.status(err.httpErrorCode).json(new response(err.appErrorCode, err.message));
  }
  else if(err){
    res.status(500).json(new response(requestCode.error, err.message));
  }
};

module.exports = errorHandler;
