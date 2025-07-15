'use strict';

/**
 * test-load router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::test-load.test-load');
