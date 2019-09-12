/**
 * This is where we define util functions
 */

 /**
  * Define console log function and start using these functions instead of console.log, console.error
  * so that we can easily turn on/off without having to remove console.log from every where
  */

const enableLogging: boolean = false;
export function consoleLog (...args: any[]) {
  if (enableLogging) {
    console.log(...args);
  }
}

export function consoleWarn (...args: any[]) {
  if (enableLogging) {
    console.warn(...args);
  }
}

export function consoleError (...args: any[]) {
  if (enableLogging) {
    console.error(...args);
  }
}

export function consoleDir (...args: any[]) {
  if (enableLogging) {
    console.dir(...args);
  }
}
