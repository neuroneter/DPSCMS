// src/plugins/csv-uploader/strapi-admin.js
export default {
  register(app) {
    app.customFields.register({
      name: 'csv-uploader',
      pluginId: 'csv-uploader',
      type: 'json', // ✅ CORREGIDO: Cambiado de 'text' a 'json'
      intlLabel: {
        id: 'csv-uploader.label',
        defaultMessage: 'CSV Uploader',
      },
      intlDescription: {
        id: 'csv-uploader.description',
        defaultMessage: 'Upload CSV files to external APIs',
      },
      components: {
        Input: () => import('./admin/src/components/CsvUploader'),
      },
      options: {
        base: [
          {
            sectionTitle: {
              id: 'csv-uploader.options.api.settings',
              defaultMessage: 'API Configuration',
            },
            items: [
              {
                name: 'options.selectedApi',
                type: 'select',
                intlLabel: {
                  id: 'csv-uploader.options.api.label',
                  defaultMessage: 'Select API',
                },
                description: {
                  id: 'csv-uploader.options.api.description',
                  defaultMessage: 'Choose which API to use for CSV uploads',
                },
                options: [
                  {
                    key: 'ofertas',
                    value: 'ofertas',
                    metadatas: {
                      intlLabel: {
                        id: 'csv-uploader.api.ofertas',
                        defaultMessage: 'API de Ofertas',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
        advanced: [
          {
            sectionTitle: {
              id: 'global.settings',
              defaultMessage: 'Settings',
            },
            items: [
              {
                name: 'required',
                type: 'checkbox',
                intlLabel: {
                  id: 'form.attribute.item.requiredField',
                  defaultMessage: 'Required field',
                },
                description: {
                  id: 'form.attribute.item.requiredField.description',
                  defaultMessage: 'You won\'t be able to create an entry if this field is empty',
                },
              },
            ],
          },
        ],
      },
    });
  },

  bootstrap(app) {
    // Bootstrap
  },
};