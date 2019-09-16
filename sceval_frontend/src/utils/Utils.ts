/**
 * This is where we define util functions
 */

 /**
  * Define console log function and start using these functions instead of console.log, console.error
  * so that we can easily turn on/off without having to remove console.log from every where
  */

const enableLogging: boolean = false;

let log;
let warn;
let error;
let dir;
if (enableLogging) {
  // If logging enabled, create logger functions that points to console functions
  log = console.log;
  warn = console.warn;
  error = console.error;
  dir = console.dir;
} else {
  // If logging disabled, create logger function that point to do nothing function
  const doNothing = (): void => {
    // do nothing
  };
  log = doNothing;
  warn = doNothing;
  error = doNothing;
  dir = doNothing;
}

// Expose these logger function
export const consoleLog = log;
export const consoleWarn = warn;
export const consoleError = error;
export const consoleDir = dir;
