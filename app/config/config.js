const path = require('path');

const config = {
  database: {
    testURL: 'mongodb://127.0.0.1:27017/treasure-radio',
    mongoURL: 'mongodb://107.167.191.206:27017/treasure-radio',
  },
  chatgpt: '',
  yating: '',
  defaultSelect: '新聞快訊'
};

module.exports = config;
