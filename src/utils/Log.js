import fs from 'fs';
import path from 'path';

const logFilePath = path.resolve('./logs/node.log');

function pad(num, size = 2) {
    let s = String(num);
    while (s.length < size) s = "0" + s;
    return s;
}

function getTimestamp() {
    const now = new Date();
    const h = pad(now.getHours());
    const m = pad(now.getMinutes());
    const s = pad(now.getSeconds());
    const ms = pad(now.getMilliseconds(), 3);
    return `${h}:${m}:${s}.${ms}`;
}

/**
 * Logger
 * 
 * A simple logging utility that writes log messages to a file and, in non-production environments, also to the console.
 * 
 * Constructor:
 *   - new Logger(env)
 *     - env: string (e.g., 'production', 'development', etc.)
 *     - Initializes the logger with the given environment and sets the log file path.
 * 
 * Methods:
 *   - info(msg: string): void
 *     - Logs an informational message.
 *     - Prepends the message with a timestamp and "INFO".
 *     - Writes the log to the log file and, if not in production, also to the console.
 * 
 *   - warn(msg: string): void
 *     - Logs a warning message.
 *     - Prepends the message with a timestamp and "WARN".
 *     - Writes the log to the log file and, if not in production, also to the console.
 * 
 *   - error(msg: string): void
 *     - Logs an error message.
 *     - Prepends the message with a timestamp and "ERROR".
 *     - Writes the log to the log file and, if not in production, also to the console.
 * 
 * Private Methods:
 *   - #_log(type: string, msg: string): void
 *     - Internal method to format and write the log message.
 *     - Used by info, warn, and error.
 * 
 * Example usage:
 *   const logger = new Logger(process.env.ENV);
 *   logger.info('Server started');
 *   logger.warn('Low disk space');
 *   logger.error('Unhandled exception');
 */
export default class Logger {
    constructor(env) {
        this.env = env;
        this.logFilePath = logFilePath;
    }

    #_log(type, msg) {
        const line = `${getTimestamp()} ${type}  ${msg}`;
        fs.appendFileSync(this.logFilePath, line + '\n', { encoding: 'utf8' });
        if (this.env !== 'production') {
            console.log(line);
        }
    }

    info(msg) {
        this.#_log('INFO',msg,);
    }

    warn(msg) {
        this.#_log('WARN',msg,);
    }

    error(msg) {
        this.#_log('ERROR',msg,);
    }
}