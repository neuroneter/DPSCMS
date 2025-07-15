'use strict';

module.exports = ({ strapi }) => {
  strapi.customFields.register({
    name: 'csv-uploader',
    plugin: 'csv-uploader',
    type: 'json', // Cambiar a JSON para almacenar metadatos
    inputSize: {
      default: 12,
      isResizable: false,
    },
  });
};