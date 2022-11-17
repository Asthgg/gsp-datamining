import fs from 'fs'
import path from 'node:path'
import { stringify } from 'csv';

const mkdirp = (filepath) => {

    fs.mkdirSync(filepath, { recursive: true }, (err) => {
        if (err) throw err;
    });

    return filepath
}


export const generateFilename = (name, extension, prefix) => {
    let path = `${mkdirp(prefix)}/${name}.${extension}`;

    return path;
}

export const writeCsvFile = (filename, columns, data, dirname) => {
    try {
        
        const stringifier = stringify({ header: true, columns: columns });
        const writableStream = fs.createWriteStream(filename);

        data.forEach(row => stringifier.write(row));

        stringifier.pipe(writableStream);
        console.log(`Finished writing data to ${filename}`);
    } catch (error) {
        console.error(error)
    }
}

