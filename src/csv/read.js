import fs from 'fs'
import path from 'node:path'
import csv from 'csv';

export const readCSV = (filename, limit) => {
    const results = [];

    return new Promise((res, rej) => {
        fs.createReadStream(filename)
        .pipe(csv.parse())
        .on('data', (data) => {
            if (results.length >= limit) {
                res(results)

            } else {
                results.push(data)
            }
        })
        .on('end', () => {
          //  console.log(results);
            res(results)
        });  
    })
}