const mongoose = require("mongoose");
const config = require('../config/config.js');

const logger = require('../config/log.config.js');

const logging = logger(__filename);

// mongoose.connect(config.mongoURL).catch((error) => logging.error(error));
const connectDB = async () => {
  try{
    mongoose.connection.on('connected', () => logging.info('Connected to mongoDB.'));

    mongoose.connection.on('error', (error) => logging.error(error));

    // await mongoose.connect(config.database.mongoURL);
    await mongoose.connect(config.database.testURL);
  }
  catch(error){
    // logging.error(error)
  }
};

module.exports = connectDB;
