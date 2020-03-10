'use strict';

/**
 * @param {KoaContext} ctx
 */
async function index(ctx) {
  ctx.body = { status: 'OK' };
}

//

module.exports = {
  index,
  //
};


/** @typedef {import('koa').Context} KoaContext */
