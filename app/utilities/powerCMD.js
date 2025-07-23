const { crc16 } = require('./utils');

class powerPrepareCMD {
  constructor(id, mode) {
    this.cmd = Buffer.allocUnsafe(14);
    Buffer.from([0x55, 0xaa, 0x03, 0x00, 0x00, 0x89, 0x70]).copy(this.cmd, 0); //Prefix
    this.cmd.writeUInt8(id, 7);
    Buffer.from([0x23, 0x80, 0x01]).copy(this.cmd, 8);
    this.cmd.writeUInt8(mode, 11);

    this.crc = Buffer.allocUnsafe(6);
    this.cmd.copy(this.crc, 0, 6, 12);

    // console.log(this.cmd);
    // console.log(this.crc);

    let ccc = crc16(this.crc, 0x8005, 0xFFFF, 0x0000, true, true);
    this.cmd.writeUint16LE(ccc, 12);
    // console.log(this.cmd);
  }

  get buf() {
    return this.cmd;
  }
}

class powerCMD {
  constructor(id, mode) {
    this.cmd = Buffer.allocUnsafe(14);
    Buffer.from([0x55, 0xaa, 0x03, 0x00, 0x00, 0x89, 0x70]).copy(this.cmd, 0); //Prefix
    this.cmd.writeUInt8(id, 7);
    Buffer.from([0x13, 0x00, 0x01]).copy(this.cmd, 8);
    this.cmd.writeUInt8(mode, 11);

    this.crc = Buffer.allocUnsafe(6);
    this.cmd.copy(this.crc, 0, 6, 12);

    // console.log(this.cmd);
    // console.log(this.crc);

    let ccc = crc16(this.crc, 0x8005, 0xFFFF, 0x0000, true, true);
    this.cmd.writeUint16LE(ccc, 12);
    // console.log(this.cmd);
  }

  get buf() {
    return this.cmd;
  }
}

class powerChannelCMD {
  constructor(id, ch, mode) {
    this.cmd = Buffer.allocUnsafe(21);
    Buffer.from([0x55, 0xaa, 0x03, 0x00, 0x00, 0x90, 0x70]).copy(this.cmd, 0); //Prefix
    this.cmd.writeUInt8(id, 7);
    Buffer.from([0x83, 0x00, 0x00]).copy(this.cmd, 8);
    let base = 11;
    for(let c=1; c<=8; c++){
      // console.log(base);
      if(c==ch) this.cmd.writeUInt8(mode, base);
      else this.cmd.writeUInt8(0x00, base);
      base += 1;
    }
    

    this.crc = Buffer.allocUnsafe(13);
    this.cmd.copy(this.crc, 0, 6, 19);

    // console.log(this.cmd);
    // console.log(this.crc);

    let ccc = crc16(this.crc, 0x8005, 0xFFFF, 0x0000, true, true);
    // console.log(ccc);
    this.cmd.writeUint16LE(ccc, 19);
    console.log(this.cmd);
  }

  get buf() {
    return this.cmd;
  }
}

module.exports = { powerPrepareCMD, powerCMD, powerChannelCMD };
