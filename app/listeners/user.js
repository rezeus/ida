'use strict';

/**
 * @param {AsyncEventEmitter} ee
 * @param {Logger} logger
 */
function registerUserListeners(ee, logger) {
  ee.on('/repositories/user/created', (user) => {
    logger.debug(`A new user created: '${user.toJSON()}'.`);
  });

  //
}

module.exports = registerUserListeners;


/** @typedef {import('../../src/AsyncEventEmitter')} AsyncEventEmitter */
/** @typedef {import('../../src/Logger')} Logger */
