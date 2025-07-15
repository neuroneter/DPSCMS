'use strict';

const fs = require('fs');
const path = require('path');

module.exports = ({ strapi }) => ({
  
  /**
   * Obtiene la configuración completa de APIs desde apis.json
   */
  getConfig() {
    try {
      const configPath = path.join(__dirname, '../config/apis.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      strapi.log.error('Error reading apis.json config:', error);
      return { apis: [], globalSettings: {} };
    }
  },

  /**
   * Obtiene todas las APIs disponibles
   */
  getAvailableApis() {
    const config = this.getConfig();
    return config.apis?.filter(api => api.enabled !== false) || [];
  },

  /**
   * Obtiene configuración de una API específica por ID
   */
  getApiById(id) {
    const apis = this.getAvailableApis();
    return apis.find(api => api.id === id);
  },

  /**
   * Obtiene configuración global
   */
  getGlobalSettings() {
    const config = this.getConfig();
    return config.globalSettings || {};
  }
});