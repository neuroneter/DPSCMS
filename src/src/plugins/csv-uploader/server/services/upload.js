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
   * Envía los datos procesados a la API externa
   */
  async sendToExternalApi(data, apiConfig) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(apiConfig.token && { 'Authorization': `Bearer ${apiConfig.token}` })
      };

      const requestPayload = {
        data: data,
        metadata: {
          totalRecords: data.length,
          apiId: apiConfig.id,
          timestamp: new Date().toISOString()
        }
      };

      const response = await axios.post(apiConfig.url, requestPayload, {
        headers,
        timeout: apiConfig.timeout || 30000
      });

      return {
        success: true,
        message: 'CSV enviado exitosamente a la API externa',
        recordsProcessed: data.length,
        apiResponse: {
          status: response.status,
          data: response.data
        }
      };

    } catch (error) {
      strapi.log.error('Error sending to external API:', error);
      
      let errorMessage = 'Error al enviar datos a la API externa';
      if (error.response) {
        errorMessage = `API Error ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con la API externa';
      }

      return {
        success: false,
        message: errorMessage,
        recordsProcessed: 0,
        error: error.message
      };
    }
  }
});