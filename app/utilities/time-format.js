/**
 * 
 * @param {Date} now 
 * @returns Date string
 */
function nowTimeFormat(){
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
}

// export default nowTimeFormat;
module.exports = nowTimeFormat;
