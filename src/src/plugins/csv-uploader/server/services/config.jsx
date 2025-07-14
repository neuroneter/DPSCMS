module.exports = ({ strapi }) => ({
  
  // ... controladores anteriores ...

  /**
   * GET /csv-uploader/config/field-options
   * Obtiene opciones para el dropdown del Custom Field
   */
  async getFieldOptions(ctx) {
    try {
      const configService = strapi.plugin('csv-uploader').service('config');
      const apis = configService.getAvailableApis();
      
      // Formatear para el dropdown de Strapi
      const options = apis.map(api => ({
        key: api.id,
        value: api.id,
        metadatas: {
          intlLabel: {
            id: `csv-uploader.api.${api.id}`,
            defaultMessage: api.name
          }
        }
      }));
      
      ctx.send({
        data: {
          apiOptions: options,
          availableApis: apis.map(api => ({
            id: api.id,
            name: api.name,
            description: api.description,
            maxRows: api.validationRules.maxRows,
            requiredColumns: api.validationRules.requiredColumns.length
          }))
        }
      });
    } catch (error) {
      strapi.log.error('Error getting field options:', error);
      ctx.throw(500, 'Error loading field options');
    }
  },

  /**
   * GET /csv-uploader/config/api-details/:id
   * Obtiene detalles de una API específica para mostrar en el campo
   */
  async getApiDetails(ctx) {
    try {
      const { id } = ctx.params;
      const configService = strapi.plugin('csv-uploader').service('config');
      const apiConfig = configService.getApiById(id);
      
      if (!apiConfig) {
        return ctx.throw(404, `API configuration '${id}' not found`);
      }
      
      ctx.send({
        data: {
          id: apiConfig.id,
          name: apiConfig.name,
          description: apiConfig.description,
          url: apiConfig.url,
          maxRows: apiConfig.validationRules.maxRows,
          requiredColumns: apiConfig.validationRules.requiredColumns,
          sampleData: apiConfig.sampleData,
          validationRules: {
            maxFileSize: apiConfig.validationRules.maxFileSize || 10,
            allowEmptyRows: apiConfig.validationRules.allowEmptyRows || false
          }
        }
      });
    } catch (error) {
      strapi.log.error('Error getting API details:', error);
      ctx.throw(500, 'Error loading API details');
    }
  }

});