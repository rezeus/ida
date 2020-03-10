'use strict';

const bodyParser = require('koa-bodyparser');
// const cors = require('@koa/cors');

/**
 * @param {KoaContext} ctx
 * @param {Function} next
 */
async function parseBody(ctx, next) {
  if (!['PUT', 'POST', 'PATCH'].includes(ctx.method.toUpperCase())) {
    ctx.disableBodyParser = true;
  }

  await next();
}

//

module.exports = (/* config */) => [
  parseBody,
  bodyParser(),
  // cors({
  //   origin: '*',
  // }),
  //
];


/** @typedef {import('koa').Context} KoaContext */
