'use strict';

/**
 * test-load service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::test-load.test-load');
