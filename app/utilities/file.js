const path = require("path");

function fileName(filePath){
  return path.basename(filePath);
}

function dirName(filePath){
  return path.dirname(filePath);
}

module.exports = {fileName, dirName};
