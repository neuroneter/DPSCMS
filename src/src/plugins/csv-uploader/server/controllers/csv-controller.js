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
   * Procesa y envía CSV a API externa con información del usuario
   */
  async uploadCsv(ctx) {
    try {
      const { apiId, csvData, fileName, userInfo } = ctx.request.body;
      
      if (!apiId || !csvData) {
        return ctx.throw(400, 'API ID and CSV data are required');
      }

      if (!userInfo || !userInfo.userEmail) {
        return ctx.throw(400, 'User information is required');
      }

      const configService = strapi.plugin('csv-uploader').service('config');
      const uploadService = strapi.plugin('csv-uploader').service('upload');
      
      // Validar configuración de API
      const apiConfig = configService.getApiById(apiId);
      if (!apiConfig) {
        return ctx.throw(404, `API configuration '${apiId}' not found`);
      }

      // Obtener información adicional del usuario si es necesario
      const enrichedUserInfo = await enrichUserInfo(ctx, userInfo);

      // Validar y procesar CSV
      const validationResult = await uploadService.validateCsv(csvData, apiConfig);
      if (!validationResult.isValid) {
        // Log del intento fallido para auditoría
        strapi.log.warn(`CSV validation failed for user ${enrichedUserInfo.userEmail}:`, {
          fileName,
          apiId,
          errors: validationResult.errors,
          user: enrichedUserInfo
        });

        return ctx.send({
          success: false,
          errors: validationResult.errors,
          data: null
        });
      }

      // Enviar a API externa con información del usuario
      const uploadResult = await uploadService.sendToExternalApiWithUser(
        validationResult.processedData, 
        apiConfig,
        enrichedUserInfo,
        fileName
      );

      // Log del resultado para auditoría
      if (uploadResult.success) {
        strapi.log.info(`CSV upload successful:`, {
          fileName,
          apiId,
          recordsProcessed: uploadResult.recordsProcessed,
          user: enrichedUserInfo,
          timestamp: new Date().toISOString()
        });
      } else {
        strapi.log.error(`CSV upload failed:`, {
          fileName,
          apiId,
          error: uploadResult.message,
          user: enrichedUserInfo,
          timestamp: new Date().toISOString()
        });
      }

      ctx.send({
        success: uploadResult.success,
        message: uploadResult.message,
        data: {
          fileName,
          apiId,
          recordsProcessed: uploadResult.recordsProcessed,
          timestamp: new Date().toISOString(),
          apiResponse: uploadResult.apiResponse,
          uploadedBy: enrichedUserInfo
        }
      });

    } catch (error) {
      strapi.log.error('Error uploading CSV:', error);
      ctx.throw(500, error.message || 'Error uploading CSV file');
    }
  }
});

/**
 * Enriquece la información del usuario con datos adicionales si es necesario
 */
async function enrichUserInfo(ctx, userInfo) {
  try {
    // Obtener información adicional del usuario desde el contexto de autenticación
    const user = ctx.state.user;
    
    return {
      ...userInfo,
      // Información adicional que se puede obtener del contexto
      authenticatedUserId: user?.id,
      sessionInfo: {
        ip: ctx.request.ip,
        userAgent: ctx.request.header['user-agent'],
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    strapi.log.warn('Could not enrich user info:', error);
    return {
      ...userInfo,
      sessionInfo: {
        ip: ctx.request.ip || 'unknown',
        userAgent: ctx.request.header['user-agent'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    };
  }
}