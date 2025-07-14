import { prefixPluginTranslations } from '@strapi/helper-plugin';

const pluginPkg = require('../../package.json');
const pluginId = pluginPkg.strapi.name;

export default {
  register(app) {
    // El registro se hace en strapi-admin.js
  },

  bootstrap(app) {
    // Bootstrap del admin
  }
};