'use strict';

const User = require('../models/User');

/**
 * @param {KoaContext} ctx
 */
async function index(ctx) {
  const users = await User.find();

  ctx.body = { users };
}

/**
 * curl -X POST -H 'Content-Type: application/json' --data-binary '{"firstname":"Jöhn","lastname":"Döe","email":"john@does.co","password":"john@does.co"}' http://localhost:3000/users
 *
 * @param {KoaContext} ctx
 */
async function create(ctx) {
  const body = ctx.request.body;

  const user = await User.create(body);

  ctx.status = 201;
  ctx.body = { user };
}

/**
 * @param {KoaContext} ctx
 */
async function findById(ctx) {
  const id = ctx.params.id;

  const user = await User.findById(id);

  if (!user) {
    ctx.throw(404);
  }

  ctx.body = { user };
}

/**
 * curl -X PATCH -H 'Content-Type: application/json' --data-binary '{"firstname":"John","lastname":"Doe"}' http://localhost:3000/users/TODO_ID
 *
 * @param {KoaContext} ctx
 */
async function updateById(ctx) {
  const id = ctx.params.id;
  const body = ctx.request.body;

  /** @type {User} */
  const user = await User.findById(id);

  if (!user) {
    ctx.throw(404);
  }

  user.setFields(body);

  await user.save();

  ctx.status = 204;
}
// async function updateById(ctx) {
//   const id = ctx.params.id;
//   const body = ctx.request.body;

//   const exists = await User.existsById(id);

//   if (!exists) {
//     ctx.throw(404);
//   }

//   await User.updateById(id, body);

//   ctx.status = 204;
// }

/**
 * curl -X DELETE http://localhost:3000/users/1583845688
 *
 * @param {KoaContext} ctx
 */
async function deleteById(ctx) {
  const id = ctx.params.id;

  const wasDeleted = await User.deleteById(id);

  ctx.status = (wasDeleted)
    ? 204
    : 200;
}

//

module.exports = {
  index,
  create,
  findById,
  updateById,
  deleteById,
  //
};


/** @typedef {import('koa').Context} KoaContext */
/** @typedef {import('../models/User')} User */
