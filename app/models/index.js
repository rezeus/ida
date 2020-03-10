'use strict';

const fs = require('fs');
const path = require('path');

// Require all the sibling files to give them a chance to register necessary event handlers
const modelFiles = fs.readdirSync(__dirname)
  .filter((fn /* filename */) => !(
    fn[0] === '_'
    || fn.substr(-3) !== '.js'
    || fn === 'index.js'
    || fn.substr(-8) === 'Model.js'
    || fn.substr(0, 4) === 'Base'
  ))
  .map((fn) => {
    // Name of the file without the extension
    const name = fn.substring(0, fn.lastIndexOf('.'));

    return {
      name,
      absPath: path.join(__dirname, fn),
    };
  });

function requireModels(context/* , services */) {
  const models = modelFiles.reduce((prev, { name, absPath }) => ({
    ...prev,
    // eslint-disable-next-line import/no-dynamic-require, global-require
    [name]: require(absPath)/* (services) */,
  }), {});

  context.models = models;
}

module.exports = requireModels;
