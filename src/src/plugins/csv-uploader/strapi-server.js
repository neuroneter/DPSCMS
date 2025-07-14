module.exports = {
  register({ strapi }) {
    // Registrar el custom field en el servidor
    strapi.customFields.register({
      name: 'csv-uploader',
      plugin: 'csv-uploader',
      type: 'text',
    });
  },

  bootstrap({ strapi }) {
    // Bootstrap del plugin
  }
};