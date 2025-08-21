// import mongoose from 'mongoose';
// import timeFormat from '../../utilities/time-format.js'

const mongoose = require("mongoose");
const { nowTimeFormat, utcTimeFormat } = require('../../utilities/time-format.js');

const { Schema } = mongoose;

const msgSchema = new Schema({
  name: { type: String, required: true},
  age: { type: Number, required: true},
  wish: { type: String, required: true},
  select: { type: String, required: false},
  device: { type: String, required: true},
  article: { type: String, required: true},
  audio_path: { type: String, required: true},
  date: { type: Date, default: utcTimeFormat() }
});

const Message = mongoose.model('message', msgSchema);

module.exports = Message;
