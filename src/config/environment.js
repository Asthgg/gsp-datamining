
require('dotenv').config();

export const config = {
  env: process.env.NODE_ENV || 'development',

  debugActive: process.env.DEBUG_ACTIVE,
  
  s3: {
    region: process.env.AWS_REGION,
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  confingDB: {
    client: {
      host: process.env.DB_HOST,
      port:  process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    },
    refreshTimeout: 1000 * 60 * 10, // 10 minutes
  }
};
