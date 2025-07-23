const mqtt = require('mqtt');
const logger = require('../../config/log.config');

const logging = logger(__filename);

const client = mqtt.connect("mqtt://192.168.10.200:1883", {
  clientId: "js-osaka-console",
  username: "ITRI",
  password: "itriJ100",
});


client.on("connect", () => {
  logging.info("MQTT connected");
  client.subscribe("teensy/server/#", (err) => {
    if (err) {
      logging.error("MQTT subscribe error");
    }
  });
});

const MQTTClient = {
  /**
   * publish payload
   * @param {String} topic 
   * @param {String | Buffer} payload 
   */
  publish: (topic, payload) => {
    client.publish(topic, payload, { qos: 0 }, (error) => {
      if (error) {
        logging.error(error);
      }
    })
  },
}

module.exports = MQTTClient;
