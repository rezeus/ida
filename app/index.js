'use strict';

const routes = require('./routes');
const middlewares = require('./middlewares');
const models = require('./models');
const registerListeners = require('./listeners');

/**
 * @param {AsyncEventEmitter} ee
 * @param {Logger} logger
 */
function boot(ee, logger) {
  // Register necessary event handlers
  //
  ee.onAsync('/router/routes/registering', routes);
  ee.onAsync('/router/middlewares/registering', middlewares);
  ee.onAsync('/kernel/services/created', models);
  //

  registerListeners(ee, logger);

  // NOTE Return providers (i.e. package names of dependant backing services)
  // Paths are relative to this file
  return [
    // './providers/neo4j',
    //
  ];
}

module.exports = boot;


/** @typedef {import('../../src/AsyncEventEmitter')} AsyncEventEmitter */
/** @typedef {import('../../src/Logger')} Logger */
