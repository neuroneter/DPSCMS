export default {
  register(app) {
    app.customFields.register({
      name: 'csv-uploader',
      plugin: 'csv-uploader',
      type: 'text', // ← Cambiar a 'text' temporalmente
      intlLabel: {
        id: 'csv-uploader.label',
        defaultMessage: 'CSV Uploader'
      },
      intlDescription: {
        id: 'csv-uploader.description',
        defaultMessage: 'Upload CSV files'
      },
      components: {
        Input: () => 'CSV Uploader Working' // ← Componente súper simple
      }
    });
  },

  bootstrap() {
    // vacío
  }
};