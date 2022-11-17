import {Client} from 'pg';
  
  export class Postgres {
    clientConfig;
  
    client;
  
    log;
  
    connected;
  
    refreshTimeout;
  
    constructor({
      clientConfig,
      log,
      refreshTimeout,
    }) {
      this.clientConfig = clientConfig;
      this.refreshTimeout = refreshTimeout;
      this.connected = false;
      this.log = log;
      this.client = null;
    }
  
    async connect() {
  
      if (this.isConnected()) return true;
  
      try {
        if (this.client !== null) {
          this.close();
        }
        this.client = new Client(this.clientConfig);
        await this.client.connect();
        this.connected = true;
      } catch (error) {
        this.log.error({
          msg: 'postgres connect',
        });
        this.connected = false;
        return false;
      }
  
      console.info('postgres connected');
      return true;
    }
  
    async close() {
      try {
        this.connected = false;
        await this.client.end();
        this.client = null;
      } catch (error) {
        this.log.error({
          msg: 'postgres close connect',
        });
      }
      return true;
    }
  
    isConnected() {
      return this.connected;
    }
  
    async getRows({ query, values }) {
      if (!this.isConnected()) {
        this.connect();
        throw new Error('db is not connected');
      }
  
      if (query.trim() === '') {
        throw new Error('The query string is empty or null');
      }
  
    //   this.log.debug({
    //     msg: `excuted query ${query}`,
    //   });
  
    //   this.log.debug({
    //     msg: `excuted values ${values}`,
    //   });
  
      const res = await this.client.query(query, values).catch((_err) => {
        throw new Error(_err);
      });
  
      if (res === undefined) return [];
  
      return res.rows;
    }
  
    async execute({ query, values }, _options) {
      if (!this.isConnected()) {
        this.connect();
        throw new Error('db is not connected');
      }
  
      if (query.trim() === '') {
        throw new Error('The query string is empty or null');
      }
  
      this.log.debug({
        msg: `excuted query ${query}`,
      });
  
      this.log.debug({
        msg: `excuted values ${values}`,
      });
  
      const res = await this.client.query(query, values).catch((_err) => {
        throw new Error(_err);
      });
  
      if (res === undefined) {
        throw new Error( 'result is undefined');
      }
  
      if (res.rows.length === 0){
        throw new Error( 'result is invalid');
      }
  
      const options = {
        withoutJSNresult: false,
        ..._options,
      };
  
      let response = '{}';
  
      Object.entries(res.rows[0]).forEach((row) => {
        // eslint-disable-next-line prefer-destructuring
        response = row[1];
      });
  
      if (options.withoutJSNresult) {
        return response;
      }
  
      return JSON.parse(response);
    }
  
    refreshConecction() {
      setInterval(async () => {
        // await this.close();
        await this.connect();
        this.log.debug({
          msg: 'db refresh connect',
        });
      }, this.refreshTimeout);
    }
  }
  