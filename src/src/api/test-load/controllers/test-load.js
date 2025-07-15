'use strict';

/**
 * test-load controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::test-load.test-load');
