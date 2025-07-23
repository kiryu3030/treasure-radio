const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');
const {fileName} = require('../utilities/file.js');

// const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_DIR = path.join(process.cwd(), 'logs');

try{
  if(!fs.existsSync(LOG_DIR)){
    fs.mkdirSync(LOG_DIR);
  }
} catch (err) {
  console.error(err);
}

const dailyTransport = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'log-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  maxSize: '20m',
  maxFiles: '14d'
});

dailyTransport.on('error', error => {
  console.error(error);
});

const { combine, timestamp, printf, errors} = winston.format;
const logFormat = printf(({ level, message, mainLabel, childLabel, timestamp, stack}) => {
  if(typeof stack !== 'undefined')
    return `[${level}][${childLabel || mainLabel}][${timestamp}] ${message} ${stack}`;
  else
    return `[${level}][${childLabel || mainLabel}][${timestamp}] ${message}`;
});

const logging = winston.createLogger({
  level: 'info',
  defaultMeta: { mainLabel: 'default' },
  format: combine(
    errors({stack: true}),
    timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
    logFormat,
  ),
  transports: [
    dailyTransport,
    new winston.transports.Console()
  ],
});

const logger = function(name) {
  return logging.child({childLabel: fileName(name)});
}

module.exports = logger;
