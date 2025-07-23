// import mongoose from 'mongoose';
// import timeFormat from '../../utilities/time-format.js'

const mongoose = require("mongoose");
const timeFormat = require('../../utilities/time-format.js');

const { Schema } = mongoose;

const msgSchema = new Schema({
  msg: { type: String, required: true},
  device: { type: String, required: true},
  date: { type: Date, default: timeFormat() }
});

const Message = mongoose.model('message', msgSchema);

module.exports = Message;
