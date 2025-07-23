const { crc16 } = require('./utils');

class powerStateCMD {
  constructor(id) {
    this.cmd = Buffer.allocUnsafe(13);
    Buffer.from([0x55, 0xaa, 0x03, 0x00, 0x00, 0x88, 0x70]).copy(this.cmd, 0); //Prefix
    this.cmd.writeUInt8(id, 7);
    Buffer.from([0x83, 0x80, 0x00]).copy(this.cmd, 8);

    this.crc = Buffer.allocUnsafe(5);
    this.cmd.copy(this.crc, 0, 6, 11);

    // console.log(this.cmd);
    // console.log(this.crc);

    let ccc = crc16(this.crc, 0x8005, 0xFFFF, 0x0000, true, true);
    this.cmd.writeUint16LE(ccc, 11);
    console.log(this.cmd);
  }

  get buf() {
    return this.cmd;
  }
}

module.exports = { powerStateCMD };
