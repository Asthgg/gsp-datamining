
export class Log {
    debugActive;

    constructor({ debugActive }) {
        this.debugActive = debugActive;
    }

    write(type, { msg, info = '' }) {
        if (!this.debugActive) return false;
        console.log(type, new Date().toLocaleString(), msg, info);
        return true;
    }

    error(args) {
        return this.write('[ERROR]', args);
    }

    log(args)  {
        return this.write('[INFO]', args);
    }

    debug(args)  {
        if (!this.debugActive) return false;
        return this.write('[DEBUG]', args);
    }
}
