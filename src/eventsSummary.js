require('dotenv').config()
import { ListObjectsCommand, GetObjectCommand, S3Client, s3 } from "@aws-sdk/client-s3";
import { config } from "./config/environment.js";
import { generateFilename, writeCsvFile } from "./csv/write.js";
import { Log } from "./lib/log/index.js";
import { Postgres } from "./lib/postgres/postgres.js";
import { getInfo, gpsLocation } from "./querys/index.js";
import { selectObject } from "./lib/s3";
import { dateToformat, dateToUTCformat, getDates } from "./utils/dates.js";
// Set the AWS Region.
const REGION = "us-east-1";
// Create an Amazon S3 service client object.
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
}})

const dateFormat = /\d{4}([.\- \/])\d{2}\1\d{2}/;

const log = Log({ debugActive: config.debugActive})


export const bucketParams = {
  Bucket: "devicetrackingconsolidated",
  Key: "integrationTests/2022/01/01",
};

var params = {
  Bucket: bucketParams.Bucket, /* required */
  Delimiter: '/consolidated.data',
  Prefix: bucketParams.Key,
};

const searchRepeated = (records) => {
  if (!records.length == 0) return []
  const repeated = records.filter(record => {
    return records.filter(r => (r.$date == record.$date) && (r.tipo_evento != record.tipo_evento)).length > 1
  })

  return repeated;
}

const sortByDate = (records) => records.sort((a,b) => a.$date-b.$date);

const isUnsorted = (original, sorted) => sorted.filter((record, index) => original.indexOf(record) != index);

const processRecords = (records, prefix) => {
  let repeated, sort, unsorted = [];

  if (records.length > 0) {
    repeated = searchRepeated(records)

    sort = sortByDate(records)

    unsorted = isUnsorted(records, sort);
  }
  

  const path = prefix.split('/');

  let row = {
    environment: path[0],
    year:  path[1],
    month: path[2],
    day: path[3],
    deviceId: path[4],
    hour: path[5],
    totalRecords: records.length,
    isSorted: unsorted.length == 0 ? "true" : "false",
    repeatedDates: repeated.length,
    prefix,
  };

  return row;
}

export const hourly = async () => {
  try {

    const {CommonPrefixes} = await s3Client.send(new ListObjectsCommand(params));

    const header = ["environment", "year", "month", "day", "deviceId", "hour", "totalRecords", "isSorted", "repeatedDates", "prefix"];

    const info = await Promise.all(
      CommonPrefixes.map(async ({ Prefix }) => {
        
        const records = await selectObject(s3Client, params.Bucket, Prefix, getInfo);
        return processRecords(records, Prefix)
      })
    );

    const keys = params.Prefix.split("/");

    const filename = generateFilename(`${keys[0]}-${keys[1]}-${keys[2]}-${keys[3]}`, "csv", process.env.CSV_DIRNAME);

    writeCsvFile(filename, header, info)

  } catch (err) {
    console.log("Error", err);
  }
};


const processRecordsDaily = (records, environment, deviceId, initialDate, finalDate) => {
  let repeated = [];
  let sort = [];
  let unsorted = [];

  if (records.length > 0) {
    repeated = searchRepeated(records)

    sort = sortByDate(records)

    unsorted = isUnsorted(records, sort);
  }

  let row = {
    environment,
    deviceId,
    initialDate,
    finalDate,
    totalRecords: records?.length || 0,
    isSorted: unsorted.length == 0 ? "true" : "false",
    repeatedDates: repeated.length
  };

  return row;
}

const getHourFromPrefix = (prefix) => Number(prefix.split("/").slice(-2, -1));
const getDeviceFromPrefix = (prefix) => Number(prefix.split("/").slice(-2, -1));

export const daily = async (env = "production", Key = "2022/11/01/") => {
  try {
    var params = {
      Bucket: bucketParams.Bucket, /* required */
      Delimiter: '/consolidated.data',
    };

    var devicesParams = {
      Bucket: bucketParams.Bucket,
      Delimiter: '/', //List only folders
      Prefix: Key
    }

    const [prefixDate] =  Key.match(dateFormat);

    const initialUTCDate = new Date(prefixDate);

    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const finalUTCDate = new Date(initialUTCDate.getTime() + MS_PER_DAY);

    console.log({prefixDate, initialUTCDate, finalUTCDate})

    const initialDate = dateToUTCformat(initialUTCDate);
    const finalDate = dateToUTCformat(finalUTCDate);


    console.log({initialDate, finalDate})

    const dayOneKey = initialDate.substring(0, 10).replace(/-/g, "/");
    const dayTwoKey = finalDate.substring(0, 10).replace(/-/g, "/");

    const firstHour = initialUTCDate.getUTCHours();
    const secondHour = finalUTCDate.getUTCHours();
 
    console.log({ firstHour, secondHour, p2: `${env}/${dayTwoKey}` })

    console.log({dayOneKey, dayTwoKey})

    const firstDayDevicesPrefixes = await s3Client.send(new ListObjectsCommand({
      ...devicesParams,
      Prefix: `${env}/${dayOneKey}/`
    }));

    console.log(`First day prefixes: ${firstDayDevicesPrefixes.CommonPrefixes[0]}`)
    console.log(firstDayDevicesPrefixes.CommonPrefixes[0].Prefix)

   // for each device Id list prefixes for initialDate and FinalDate
   

   const prefixesByDevice = await Promise.all(
    firstDayDevicesPrefixes.CommonPrefixes.map(async ({ Prefix }) => {
      console.log({ Prefix })
      const device = getDeviceFromPrefix(Prefix);

      const firstDayPrefixes = await s3Client.send(new ListObjectsCommand({
        ...params,
        Prefix: `${env}/${dayOneKey}/${device}`
      }));

      const secondDayPrefixes = await s3Client.send(new ListObjectsCommand({
        ...params,
        Prefix: `${env}/${dayTwoKey}/${device}`
      }));

      
  //    console.log("firstDayPrefixes: ", firstDayPrefixes.CommonPrefixes.length);
  //    console.log("secondDayPrefixes: ", secondDayPrefixes.CommonPrefixes.length);

 // console.log("size filter: ", firstDayPrefixes.CommonPrefixes.length)

 //if (!secondDayPrefixes.CommonPrefixes) console.log("undefined: ", secondDayPrefixes)

      let firstPrefixes = [];
      let secondPrefixes = [];

      if (firstDayPrefixes.CommonPrefixes?.length >= 1) {
        firstPrefixes = firstDayPrefixes.CommonPrefixes.filter((key) =>
          getHourFromPrefix(key.Prefix) >= firstHour
        )
      }

      if (secondDayPrefixes.CommonPrefixes?.length >= 1) {
        secondPrefixes = secondDayPrefixes.CommonPrefixes.filter((key) => 
          getHourFromPrefix(key.Prefix) < secondHour
        )
      }
 
  //    console.log(`firstPrefixes >= ${firstHour}: ${firstPrefixes.length}`)
   //   console.log(`secondPrefixes < ${secondHour}: ${secondPrefixes.length}`)

      const allPrefixes = firstPrefixes.concat(secondPrefixes);

      if (!allPrefixes.length) console.log('no prefixes: ', allPrefixes)

    //  console.log(`Total prefixes for deviceId ${device}: ${allPrefixes.length}`)  
      return {device, prefixes: allPrefixes};
    })
   )

   console.log(`Total devices: ${prefixesByDevice.length}`)  

  const info = await Promise.all(
    prefixesByDevice.map(async ({device, prefixes}) => {
      if (prefixes.length == 0 ) return processRecordsDaily([], env, device, initialDate, finalDate);
     // if (prefixes.length == 1) return await selectObject(s3Client, params.Bucket, result, getInfo);
      
      let result = await prefixes.reduce(async (previous, current, index) => {
      
        let p = await previous;
        if (index == 1) {
      //    console.log('Problem: ', p)
          p = await selectObject(s3Client, params.Bucket, p.Prefix, getInfo);
        }

    //      console.log('current: ', current)
        const records = await selectObject(s3Client, params.Bucket, current.Prefix, getInfo);
        return p.concat(records)
      })
      console.log({ device, result: result.length})

    //  if (prefixes.length == 1) console.log("length one: ", result, prefixes)
      if (prefixes.length == 1) { // for prefixes.length == 1

        result = await selectObject(s3Client, params.Bucket, prefixes[0].Prefix, getInfo);
      }

      return processRecordsDaily(result, env, device, initialDate, finalDate);
    })
  );

  console.log('INFOFOFOF: ', info.length)

  const header = Object.keys(info[0]);

  const filename = generateFilename(`${env}-${initialDate.substring(0, 10)}-${finalDate.substring(0, 10)}`, "csv", process.env.CSV_DIRNAME);
  writeCsvFile(filename, header, info)

  } catch (err) {
    console.log("Error", err);
  }
};
