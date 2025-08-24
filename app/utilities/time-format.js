const { DateTime } = require('luxon');

/**
 * 
 * @param {Date} now 
 * @returns Date string
 */
function nowTimeFormat(){
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds()}`;
}

/**
 * 
 * @param {Date} now 
 * @returns Date string
 */
function nowAudioFileTimeFormat(){
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds()}`;
}

function utcTimeFormat(){
  const local = DateTime.now().setZone('Asia/Taipei');
  return local.toUTC();
}

// export default nowTimeFormat;
module.exports = { nowTimeFormat, utcTimeFormat, nowAudioFileTimeFormat };
