'use strict';

/**
 * test-conten service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::test-conten.test-conten');
