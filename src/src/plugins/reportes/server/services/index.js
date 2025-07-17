'use strict';

const collection = require('./collection');
const schema = require('./schema');
const template = require('./template');
const importService = require('./import');

module.exports = {
  collection,
  schema,
  template,
  import: importService,
};