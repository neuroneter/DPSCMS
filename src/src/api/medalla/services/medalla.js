'use strict';

/**
 * medalla service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::medalla.medalla');
