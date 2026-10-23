import fs from 'fs';
import path from 'path';

/**
 * Logger
 *
 * A simple logging utility that writes log messages to a file and,
 * in non-production environments, also to the console.
 * Methods:
 *   - info(msg: string): void
 *     - Logs an informational message.
 *
 *   - warn(msg: string): void
 *     - Logs a warning message.
 *
 *   - error(msg: string): void
 *     - Logs an error message.
 *
 *
 * Example usage:
 *   const logger = new Logger(process.env.ENV);
 *   logger.info('Server started');
 *   logger.warn('Low disk space');
 *   logger.error('Unhandled exception');
 */
export default class Logger {
    env: string;
    logFilePath: string;
    constructor(env: string) {
        if (env !== 'dev' && env !== 'production') {
            throw new Error('ENV is not set correctly.');
        }
        this.env = env;
        this.logFilePath = path.resolve('./logs/node.log');
    }

    #_log(type: string, msg: string) {
        const line = `${this.#_getTimestamp()} ${type}  ${msg}`;
        fs.appendFileSync(this.logFilePath, line + '\n', { encoding: 'utf8' });
        if (this.env !== 'production') {
            // eslint-disable-next-line no-console
            console.log(line);
        }
    }

    #_pad(num: number, size: number = 2): string {
        let s = String(num);
        while (s.length < size) s = '0' + s;
        return s;
    }

    #_getTimestamp(): string {
        const now = new Date();
        const weekday = now.toLocaleString('en-US', { weekday: 'long' });
        const day = this.#_pad(now.getDate());
        const month = this.#_pad(now.getMonth() + 1); // Months are zero-based
        const year = now.getFullYear();
        const h = this.#_pad(now.getHours());
        const m = this.#_pad(now.getMinutes());
        const s = this.#_pad(now.getSeconds());
        const ms = this.#_pad(now.getMilliseconds(), 3);
        return `${weekday} ${day}/${month}/${year} ${h}:${m}:${s}.${ms}`;
    }

    info(msg: string): void {
        this.#_log('INFO', msg);
    }

    warn(msg: string): void {
        this.#_log('WARN', msg);
    }

    error(msg: string): void {
        this.#_log('ERROR', msg);
    }
}
