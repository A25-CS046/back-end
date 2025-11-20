const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const readCsvData = (filename) => {
  return new Promise((resolve, reject) => {
    const results = [];

    const filePath = path.join(
      __dirname,
      "../../../machine-learning/data",
      filename
    );

    if (!fs.existsSync(filePath)) {
      return reject(
        new Error(`File ${filename} tidak ditemukan di path: ${filePath}`)
      );
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

module.exports = { readCsvData };
