'use strict';

const Papa = require('papaparse');
const XLSX = require('xlsx');

module.exports = ({ strapi }) => ({
  
  /**
   * Procesa e importa un archivo CSV/Excel a un Collection Type
   */
  async processImport(file, collectionTypeUID, user) {
    try {
      strapi.log.info(`Starting import process for ${collectionTypeUID} by user ${user.email}`);
      
      // Leer y parsear archivo
      const records = await this.parseFile(file);
      
      if (!records || records.length === 0) {
        throw new Error('El archivo está vacío o no contiene datos válidos');
      }

      // Validar todos los registros
      const validationResults = await this.validateAllRecords(records, collectionTypeUID);
      
      if (!validationResults.isValid) {
        return {
          success: false,
          errors: validationResults.errors,
          results: {
            total: records.length,
            imported: 0,
            skipped: records.length,
            errors: validationResults.errors.length
          }
        };
      }

      // Importar registros válidos
      const importResults = await this.importRecords(
        validationResults.validRecords, 
        collectionTypeUID, 
        user
      );

      strapi.log.info(`Import completed for ${collectionTypeUID}: ${importResults.imported} records imported`);
      
      return {
        success: true,
        results: {
          total: records.length,
          imported: importResults.imported,
          skipped: importResults.skipped,
          errors: importResults.errors,
          timestamp: new Date().toISOString(),
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstname} ${user.lastname}`.trim()
          }
        }
      };

    } catch (error) {
      strapi.log.error('Error in import process:', error);
      throw error;
    }
  },

  /**
   * Parsea archivo CSV o Excel
   */
  async parseFile(file) {
    const fileName = file.name || file.originalname || '';
    
    if (fileName.endsWith('.csv') || file.mimetype === 'text/csv') {
      return this.parseCsvFile(file);
    } else if (fileName.match(/\.(xlsx|xls)$/i)) {
      return this.parseExcelFile(file);
    } else {
      throw new Error('Formato de archivo no soportado. Use CSV o Excel (.xlsx, .xls)');
    }
  },

  /**
   * Parsea archivo CSV
   */
  async parseCsvFile(file) {
    return new Promise((resolve, reject) => {
      const content = file.buffer ? file.buffer.toString('utf8') : file;
      
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`Error parsing CSV: ${results.errors[0].message}`));
            return;
          }
          resolve(results.data);
        },
        error: (error) => {
          reject(new Error(`Error parsing CSV: ${error.message}`));
        }
      });
    });
  },

  /**
   * Parsea archivo Excel
   */
  async parseExcelFile(file) {
    try {
      const buffer = file.buffer || file;
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // Usar la primera hoja
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('El archivo Excel no contiene hojas válidas');
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON con headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      return jsonData;

    } catch (error) {
      throw new Error(`Error parsing Excel file: ${error.message}`);
    }
  },

  /**
   * Valida todos los registros antes de importar
   */
  async validateAllRecords(records, collectionTypeUID) {
    const errors = [];
    const validRecords = [];
    const schemaService = strapi.plugin('reportes').service('schema');

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 porque empezamos en fila 2 (después de headers)
      
      try {
        const validation = await schemaService.validateRecord(record, collectionTypeUID, rowNumber);
        
        if (validation.isValid) {
          validRecords.push(validation.data);
        } else {
          errors.push(...validation.errors);
        }
        
      } catch (error) {
        errors.push({
          field: 'general',
          message: `Error validando fila ${rowNumber}: ${error.message}`,
          row: rowNumber,
          type: 'validation_error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validRecords,
      totalRecords: records.length,
      validCount: validRecords.length,
      errorCount: errors.length
    };
  },

  /**
   * Importa registros válidos al Collection Type
   */
  async importRecords(validRecords, collectionTypeUID, user) {
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of validRecords) {
      try {
        // Crear registro usando el Entity Service
        const createdEntry = await strapi.entityService.create(collectionTypeUID, {
          data: record
        });

        if (createdEntry) {
          imported++;
        } else {
          skipped++;
        }

      } catch (error) {
        errors++;
        strapi.log.error(`Error creating record in ${collectionTypeUID}:`, {
          error: error.message,
          data: record,
          user: user.email
        });
      }
    }

    return {
      imported,
      skipped,
      errors
    };
  }
});