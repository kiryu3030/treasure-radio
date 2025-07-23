/**
 * Re map a value.
 * @param {Number} value 
 * @param {Number} inMin 
 * @param {Number} inMax 
 * @param {Number} outMin 
 * @param {Number} outMax 
 * @returns 
 */
function map(value, inMin, inMax, outMin, outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

/**
 * Create a function that maps a value to a range
 * @param  {Number}   inMin    Input range minimun value
 * @param  {Number}   inMax    Input range maximun value
 * @param  {Number}   outMin   Output range minimun value
 * @param  {Number}   outMax   Output range maximun value
 * @return {function}          A function that converts a value
 */
function createMap(inMin, inMax, outMin, outMax) {
  return function remaper(x) {
      return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  };
}

/**
 * Sleep function
 */
async function sleep(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

/**
 * CRC16
 * @param {Array} data 
 * @param {Number} poly 
 * @param {Number} initCrc 
 * @param {Number} xorOut 
 * @param {boolean} reflectInput 
 * @param {boolean} reflectOutput 
 * @returns {Number}
 */
function crc16(data, poly, initCrc, xorOut, reflectInput = false, reflectOutput = false) {
  function reflectBits(value, bitCount) {
      let reflection = 0;
      for (let i = 0; i < bitCount; i++) {
          if (value & (1 << i)) {
              reflection |= 1 << (bitCount - 1 - i);
          }
      }
      return reflection;
  }

  let crc = initCrc;
  for (let byte of data) {
      if (reflectInput) {
          byte = reflectBits(byte, 8);
      }
      crc ^= (byte << 8);
      for (let i = 0; i < 8; i++) {
          if (crc & 0x8000) {
              crc = (crc << 1) ^ poly;
          } else {
              crc <<= 1;
          }
          crc &= 0xFFFF; // 保持 16 位
      }
  }
  if (reflectOutput) {
      crc = reflectBits(crc, 16);
  }
  return crc ^ xorOut;
}

module.exports = { map, createMap, sleep, crc16 };
