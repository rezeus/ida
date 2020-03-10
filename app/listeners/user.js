'use strict';

/**
 * @param {AsyncEventEmitter} ee
 * @param {Logger} logger
 */
function registerUserListeners(ee, logger) {
  ee.onAsync('/models/user/created', (user) => new Promise((resolve) => {
    setTimeout(() => {
      logger.debug(`A new user was created: '${JSON.stringify(user.toJSON())}'.`);

      resolve();
    }, 1000);
  }));

  ee.onAsync('/models/user/updated', (_, changedFieldNames) => {
    logger.debug(`A user was updated, changed fields: '${changedFieldNames.join(', ')}'.`);
  });

  //
}

module.exports = registerUserListeners;


/** @typedef {import('../../src/AsyncEventEmitter')} AsyncEventEmitter */
/** @typedef {import('../../src/Logger')} Logger */
