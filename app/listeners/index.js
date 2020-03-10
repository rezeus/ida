'use strict';

const fs = require('fs');
const path = require('path');

// Require all the sibling files to give them a chance to register necessary event handlers
const listeners = fs.readdirSync(__dirname)
  .filter((fn /* filename */) => !(fn[0] === '_' || fn.substr(-3) !== '.js' || fn === 'index.js'))
  .map((fn) => {
    // Name of the file without the extension
    const name = fn.substring(0, fn.lastIndexOf('.'));

    return {
      name,
      absPath: path.join(__dirname, fn),
    };
  })
  .reduce((prev, { name, absPath }) => ({
    ...prev,
    // eslint-disable-next-line import/no-dynamic-require, global-require
    [name]: require(absPath),
  }), {});

/**
 * @param {AsyncEventEmitter} ee
 * @param {Logger} logger
 */
function registerListeners(ee, logger) {
  Object.keys(listeners).forEach((listenerName) => {
    if (typeof listeners[listenerName] !== 'function') {
      throw new TypeError(`Listener ('${listenerName}') is not a function.`);
    }
    listeners[listenerName](ee, logger);
  });
}

module.exports = registerListeners;


/** @typedef {import('../../src/AsyncEventEmitter')} AsyncEventEmitter */
/** @typedef {import('../../src/Logger')} Logger */
