const udp = require('dgram');

const client = udp.createSocket('udp4');

client.on('message', (msg, info) => {
  console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port)
});

const UDPClient = {
  /**
   * Send data
   * @param {Buffer} data 
   */
  send: (data) => {
    client.send(data, 56113, '192.168.10.195', error => {
      if (error) {
        console.log(error)
      }
    });
  },
}

module.exports = UDPClient;
