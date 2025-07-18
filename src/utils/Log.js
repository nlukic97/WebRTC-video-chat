/**
 * Simple logging utility.
 * 
 * Usage:
 *   import { useLog } from './utils/Log.js';
 *   const Log = useLog(process.env.ENV);
 *   Log('This will log only if not in production');
 * 
 * The Log function will only output messages to the console
 * if the environment is not set to 'production'.
 */

// @todo - rather than using console.log, perhaps we could add these logs to an actualy log file for production.
export function useLog(ENV){
    return function Log(msg){
        if(ENV !=='production'){
            console.log(msg)   
        }
    }
}