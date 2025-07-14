'use strict';

/**
 * pqr service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::pqr.pqr');
