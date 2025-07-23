const express = require('express');
const logger = require('../../config/log.config');

const logging = logger(__filename);

const messageService = {
  
   /**
   * Insert a car
   * @route {POST} /car
   * @param {express.Request} req 
   * @param {express.Response} res 
   * @param {express.NextFunction} next 
   */
    insert: async(req, res, next) => {
      try {
        const { name, ip, steeringWheel, firstSeat, firstSeatSlave, secondSeat, thirdSeat } = req.body;
        console.log(name);
        console.log(ip);
        console.log(steeringWheel);
        console.log(firstSeat);
        console.log(firstSeatSlave);
        console.log(secondSeat);
        console.log(thirdSeat);
  
        const car = new Car({
          name: name,
          date: timeFormat(),
          ip:{
            z: ip.z
          },
          steeringWheel: {
            angle: steeringWheel.angle,
            vector: steeringWheel.vector,
            y: steeringWheel.y
          },
          firstSeat: {
            x: firstSeat.x,
            y: firstSeat.y,
            z: firstSeat.z
          },
          firstSeatSlave: {
            x: firstSeatSlave.x,
            y: firstSeatSlave.y,
            z: firstSeatSlave.z
          },
          secondSeat: {
            x: secondSeat.x,
            y: secondSeat.y,
            z: secondSeat.z
          },
          thirdSeat: {
            x: thirdSeat.x,
            y: thirdSeat.y,
            z: thirdSeat.z
          }
        })
        await car.save()
  
        const cars = await Car.find({}).select(
          '-date -__v -ip._id -ip.__v -steeringWheel._id -steeringWheel.__v -firstSeat._id -firstSeat.__v -secondSeat._id -secondSeat.__v -thirdSeat._id -thirdSeat.__v'
        ).limit(30).sort({date: 1}).exec();
        if(cars==undefined) throw new AppException(404, requestCode.db_query_error, `Can't get cars`);
        let lastPosIndex = 0;
        for(let i=0; i<cars.length; i++) {
          if(cars[i].name=='lastPos') lastPosIndex = i;
        }
        cars.splice(lastPosIndex, 1);
        
        res.status(200).json(new response(requestCode.ok, cars));
      } catch (error) {
        logging.error(error);
        next(error);
      }
    },
};

module.exports = messageService;
