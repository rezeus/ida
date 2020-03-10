'use strict';

/* eslint-disable no-console */

const LOG_LEVEL_ALERT = 1;
const LOG_LEVEL_CRITICAL = 2;
const LOG_LEVEL_ERROR = 3;
const LOG_LEVEL_WARNING = 4;
const LOG_LEVEL_NOTICE = 5;
const LOG_LEVEL_INFO = 6; // `log()`
const LOG_LEVEL_DEBUG = 7;

class Logger {
  constructor(level = LOG_LEVEL_INFO) {
    this.level = level;
  }

  alert(message, ...optionalParams) {
    if (this.level >= LOG_LEVEL_ALERT) {
      console.log(`ALERT: ${message}`, ...optionalParams);
    }
  }

  critical(message, ...optionalParams) {
    if (this.level >= LOG_LEVEL_CRITICAL) {
      console.log(`CRITICAL: ${message}`, ...optionalParams);
    }
  }

  error(message, ...optionalParams) {
    if (this.level >= LOG_LEVEL_ERROR) {
      console.log(`ERROR: ${message}`, ...optionalParams);
    }
  }

  warning(message, ...optionalParams) {
    if (this.level >= LOG_LEVEL_WARNING) {
      console.log(`WARNING: ${message}`, ...optionalParams);
    }
  }

  notice(message, ...optionalParams) {
    if (this.level >= LOG_LEVEL_NOTICE) {
      console.log(`NOTICE: ${message}`, ...optionalParams);
    }
  }

  info(message, ...optionalParams) {
    if (this.level >= LOG_LEVEL_INFO) {
      console.log(`INFO: ${message}`, ...optionalParams);
    }
  }

  debug(message, ...optionalParams) {
    if (this.level >= LOG_LEVEL_DEBUG) {
      console.log(`DEBUG: ${message}`, ...optionalParams);
    }
  }
}
Logger.prototype.log = Logger.prototype.info;

module.exports = Logger;
module.exports.LOG_LEVEL_ALERT = LOG_LEVEL_ALERT;
module.exports.LOG_LEVEL_CRITICAL = LOG_LEVEL_CRITICAL;
module.exports.LOG_LEVEL_ERROR = LOG_LEVEL_ERROR;
module.exports.LOG_LEVEL_WARNING = LOG_LEVEL_WARNING;
module.exports.LOG_LEVEL_NOTICE = LOG_LEVEL_NOTICE;
module.exports.LOG_LEVEL_INFO = LOG_LEVEL_INFO;
module.exports.LOG_LEVEL_DEBUG = LOG_LEVEL_DEBUG;
