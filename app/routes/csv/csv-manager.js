const fs = require("fs");
const { parse } = require("csv-parse");

// const parseCSV = (filePath) => {
//   return new Promise((resolve, reject) => {
//     try {
//       const results = [];
//       const stream = fs.createReadStream(filePath)
//         .pipe(parse({ delimiter: ',', from_line: 2 }));

//       stream.on('data', (row) => {
//         results.push(row);
//       });

//       stream.on('end', () => {
//         resolve(results);
//       });

//       stream.on('error', (error) => {
//         reject(error);
//       });
      
//     } catch (error) {
//       reject(error); // Catch synchronous errors in promise setup
//     }
//   });
// };

const parseCSV = async (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(parse({ delimiter: ',', from_line: 2 }))
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

module.exports = {parseCSV};
