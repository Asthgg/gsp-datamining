require('dotenv').config()
import { ListObjectsCommand, GetObjectCommand, S3Client, s3 } from "@aws-sdk/client-s3";
import { config } from "./config/environment.js";
import { readCSV } from "./csv/read.js";
import { generateFilename, writeCsvFile } from "./csv/write.js";
import { Log } from "./lib/log/index.js";
import { Postgres } from "./lib/postgres/postgres.js";
import { calculateDistance } from "./preprocessors/harvesing.js";
import { gpsLocation } from "./querys/index.js";
import { dateToformat, dateToUTCformat, getDates } from "./utils/dates.js";

const dateFormat = /\d{4}([.\- \/])\d{2}\1\d{2}/;

const log = new Log({ debugActive: config.debugActive})

const params = {
    limit: 1000
}

const processData = (gpsPoints) => {
    let distance = 0;

    let data = [];

    gpsPoints.forEach((point, index) => {
        if (index !== 0) {
            distance = calculateDistance(gpsPoints[index - 1], point);
        }

        if (point.latitude !==0 || point.longitude !== 0) {
            data.push({...point, distance})
        }
    })

    return data;
}

export const buildTravels = async (initialDate, finalDate, limit) => {
  const db = new Postgres({
    clientConfig: config.confingDB.client,
    log,
    refreshTimeout: config.confingDB.refreshTimeout
  });

  await db.connect();

  db.refreshConecction();
  

  const dates = getDates(initialDate, finalDate);

  console.log({dates})

  const devices = await readCSV('./datasets/devices.csv', limit);

  const header = ["id", 'date', 'speed', 'longitude', 'latitude', 'description', 'direction', 'distance'];

  const travels = await Promise.all(devices.slice(1).map(async (deviceid) => {
    let query = '';
    
    dates.forEach((date, index) => {
        if (index > 0){
        query += ' UNION ';
        }

        query += gpsLocation(index, date);
    });

    query += 'ORDER BY date ASC LIMIT $4 ';

    const rows = await db.getRows({
        query,
        values: [deviceid[0], initialDate, finalDate, limit],
    });

    if (rows.length > 0) {
        const processed = processData(rows);

         if (processData.length > 0) {
            const filename = generateFilename(`${deviceid[0]}-travel-${initialDate.substring(0, 10)}`, "csv", `${process.env.CSV_DIRNAME}/travels`);
     
            writeCsvFile(filename, header, processed);  
         }  
    } 

    return {deviceid: deviceid[0], company_name: deviceid[2], totalLocations: rows.length}
  }));
    console.log(travels.length);

    await db.close();

    const filename = generateFilename(`summary`, "csv", process.env.CSV_DIRNAME);

    const headerSummary = ["deviceid", "company_name", "totalLocations"]

    writeCsvFile(filename, headerSummary, travels)    
}
