'use strict';

const Papa = require('papaparse');
const axios = require('axios');

module.exports = ({ strapi }) => ({
  
  /**
   * Valida el contenido del CSV según la configuración de la API
   */
  async validateCsv(csvData, apiConfig) {
    try {
      // Parsear CSV
      const parseResult = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true,
        delimiter: ','
      });

      if (parseResult.errors.length > 0) {
        return {
          isValid: false,
          errors: parseResult.errors.map(err => ({
            type: 'parse_error',
            message: `Error en fila ${err.row}: ${err.message}`,
            row: err.row
          }))
        };
      }

      const data = parseResult.data;
      const headers = parseResult.meta.fields;
      const errors = [];

      // Validar número de filas
      if (apiConfig.validationRules?.maxRows && data.length > apiConfig.validationRules.maxRows) {
        errors.push({
          type: 'file_size',
          message: `El archivo excede el límite de ${apiConfig.validationRules.maxRows} filas. Filas actuales: ${data.length}`
        });
      }

      // Validar columnas requeridas
      const requiredColumns = apiConfig.validationRules?.requiredColumns || [];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        errors.push({
          type: 'missing_columns',
          message: `Columnas requeridas faltantes: ${missingColumns.join(', ')}`
        });
      }

      // Validar datos por fila
      data.forEach((row, index) => {
        // Validar columnas requeridas no vacías
        requiredColumns.forEach(column => {
          if (!row[column] || row[column].toString().trim() === '') {
            errors.push({
              type: 'required_field',
              message: `Fila ${index + 2}: El campo '${column}' es obligatorio`,
              row: index + 2,
              column
            });
          }
        });

        // Validaciones específicas de columnas
        if (apiConfig.validationRules?.columnValidations) {
          Object.entries(apiConfig.validationRules.columnValidations).forEach(([column, validation]) => {
            const value = row[column];
            if (value && validation.pattern) {
              const regex = new RegExp(validation.pattern);
              if (!regex.test(value)) {
                errors.push({
                  type: 'format_error',
                  message: `Fila ${index + 2}: '${column}' tiene formato inválido. Valor: "${value}"`,
                  row: index + 2,
                  column
                });
              }
            }
          });
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        processedData: errors.length === 0 ? data : null,
        totalRows: data.length,
        headers
      };

    } catch (error) {
      strapi.log.error('Error validating CSV:', error);
      return {
        isValid: false,
        errors: [{
          type: 'validation_error',
          message: 'Error interno al validar el archivo CSV'
        }]
      };
    }
  },

  /**
   * Envía los datos procesados a la API externa con información del usuario
   */
  async sendToExternalApiWithUser(data, apiConfig, userInfo, fileName) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(apiConfig.token && { 'Authorization': `Bearer ${apiConfig.token}` })
      };

      // Payload extendido con información del usuario
      const requestPayload = {
        // Datos del CSV
        data: data,
        
        // Metadatos del archivo
        fileMetadata: {
          fileName: fileName,
          totalRecords: data.length,
          uploadTimestamp: new Date().toISOString(),
          apiId: apiConfig.id
        },
        
        // Información del usuario que realizó la carga
        uploadedBy: {
          userId: userInfo.userId,
          email: userInfo.userEmail, // CAMPO REQUERIDO por la API
          name: userInfo.userName,
          username: userInfo.username,
          
          // Información adicional de sesión
          sessionInfo: userInfo.sessionInfo || {
            ip: 'unknown',
            userAgent: 'unknown',
            timestamp: new Date().toISOString()
          }
        },
        
        // Información del sistema
        systemInfo: {
          source: 'Strapi CMS',
          version: '5.5.0',
          plugin: 'csv-uploader',
          processingTimestamp: new Date().toISOString()
        }
      };

      strapi.log.info(`Sending CSV to external API: ${apiConfig.url}`, {
        fileName,
        recordCount: data.length,
        userEmail: userInfo.userEmail,
        apiId: apiConfig.id
      });

      const response = await axios.post(apiConfig.url, requestPayload, {
        headers,
        timeout: apiConfig.timeout || 30000
      });

      strapi.log.info(`External API response received:`, {
        status: response.status,
        apiId: apiConfig.id,
        userEmail: userInfo.userEmail,
        fileName
      });

      return {
        success: true,
        message: `CSV enviado exitosamente a ${apiConfig.name} por ${userInfo.userEmail}`,
        recordsProcessed: data.length,
        apiResponse: {
          status: response.status,
          data: response.data,
          headers: response.headers
        },
        userEmail: userInfo.userEmail,
        userName: userInfo.userName
      };

    } catch (error) {
      strapi.log.error('Error sending to external API:', error);
      
      let errorMessage = 'Error al enviar datos a la API externa';
      let errorDetails = {};

      if (error.response) {
        // Error de respuesta de la API
        errorMessage = `API Error ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
        errorDetails = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      } else if (error.request) {
        // Error de conexión
        errorMessage = 'No se pudo conectar con la API externa - Verificar conectividad';
        errorDetails = {
          code: error.code,
          message: error.message
        };
      } else {
        // Error de configuración
        errorMessage = `Error de configuración: ${error.message}`;
        errorDetails = {
          message: error.message
        };
      }

      // Log detallado del error para diagnóstico
      strapi.log.error(`External API Error Details:`, {
        apiId: apiConfig.id,
        apiUrl: apiConfig.url,
        userEmail: userInfo.userEmail,
        fileName,
        error: errorDetails,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        message: errorMessage,
        recordsProcessed: 0,
        error: error.message,
        errorDetails,
        userEmail: userInfo.userEmail,
        userName: userInfo.userName
      };
    }
  },

  /**
   * Método legacy para compatibilidad (sin información de usuario)
   * @deprecated Use sendToExternalApiWithUser instead
   */
  async sendToExternalApi(data, apiConfig) {
    strapi.log.warn('Using deprecated sendToExternalApi method without user tracking');
    
    // Crear userInfo genérico para mantener compatibilidad
    const genericUserInfo = {
      userId: 'legacy',
      userEmail: 'system@legacy.com',
      userName: 'Sistema Legacy',
      username: 'legacy-system',
      sessionInfo: {
        ip: 'unknown',
        userAgent: 'legacy-call',
        timestamp: new Date().toISOString()
      }
    };

    return this.sendToExternalApiWithUser(data, apiConfig, genericUserInfo, 'legacy-file.csv');
  }
});