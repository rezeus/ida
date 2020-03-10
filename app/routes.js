'use strict';

const miscellaneousController = require('./controllers/miscellaneous');
const usersController = require('./controllers/users');
//

// NOTE [BPTWCREGROU]: Best Practise to throw an error if TWice REGistering ROUtes
let wasRegistered = false;

/**
 * @param {Router} router
 * @param {Logger} logger
 */
function registerRoutes(router/* , logger */) {
  router.get('/', miscellaneousController.index);

  router.scope('/users', (users) => {
    users.get('/', usersController.index);
    users.post('/', usersController.create);

    users.scope('/:id', (user) => {
      user.get('/', usersController.findById);
      user.patch('/', usersController.updateById);
      user.delete('/', usersController.deleteById);
    });
  });

  // NOTE Add routes
}

module.exports = (...args) => {
  // NOTE [BPTWCREGROU]
  if (wasRegistered) {
    throw new Error('Trying to re-register existing routes.');
  }

  registerRoutes(...args);

  // NOTE [BPTWCREGROU]
  wasRegistered = true;
};


/** @typedef {import('@rezeus/korauter')} Router */
/** @typedef {import('../../src/Logger')} Logger */
