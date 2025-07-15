'use strict';

module.exports = ({ strapi }) => ({
  
  /**
   * GET /csv-uploader/config/apis
   * Obtiene las APIs disponibles para el dropdown del custom field
   */
  async getAvailableApis(ctx) {
    try {
      const configService = strapi.plugin('csv-uploader').service('config');
      const apis = configService.getAvailableApis();
      
      const apiOptions = apis.map(api => ({
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
          options: apiOptions,
          apis: apis.map(api => ({
            id: api.id,
            name: api.name,
            description: api.description,
            maxRows: api.validationRules?.maxRows || 1000,
            requiredColumns: api.validationRules?.requiredColumns || []
          }))
        }
      });
    } catch (error) {
      strapi.log.error('Error getting available APIs:', error);
      ctx.throw(500, 'Error loading available APIs');
    }
  },

  /**
   * GET /csv-uploader/config/api/:id
   * Obtiene detalles de una API específica
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
        data: apiConfig
      });
    } catch (error) {
      strapi.log.error('Error getting API details:', error);
      ctx.throw(500, 'Error loading API details');
    }
  },

  /**
   * POST /csv-uploader/upload
   * Procesa y envía CSV a API externa
   */
  async uploadCsv(ctx) {
    try {
      const { apiId, csvData, fileName } = ctx.request.body;
      
      if (!apiId || !csvData) {
        return ctx.throw(400, 'API ID and CSV data are required');
      }

      const configService = strapi.plugin('csv-uploader').service('config');
      const uploadService = strapi.plugin('csv-uploader').service('upload');
      
      // Validar configuración de API
      const apiConfig = configService.getApiById(apiId);
      if (!apiConfig) {
        return ctx.throw(404, `API configuration '${apiId}' not found`);
      }

      // Validar y procesar CSV
      const validationResult = await uploadService.validateCsv(csvData, apiConfig);
      if (!validationResult.isValid) {
        return ctx.send({
          success: false,
          errors: validationResult.errors,
          data: null
        });
      }

      // Enviar a API externa
      const uploadResult = await uploadService.sendToExternalApi(
        validationResult.processedData, 
        apiConfig
      );

      ctx.send({
        success: uploadResult.success,
        message: uploadResult.message,
        data: {
          fileName,
          apiId,
          recordsProcessed: uploadResult.recordsProcessed,
          timestamp: new Date().toISOString(),
          apiResponse: uploadResult.apiResponse
        }
      });

    } catch (error) {
      strapi.log.error('Error uploading CSV:', error);
      ctx.throw(500, error.message || 'Error uploading CSV file');
    }
  }
});