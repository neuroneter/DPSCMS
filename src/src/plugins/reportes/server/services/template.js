'use strict';

const XLSX = require('xlsx');

module.exports = ({ strapi }) => ({
  
  /**
   * Genera una plantilla Excel para un Collection Type específico
   */
  async generateTemplate(uid) {
    try {
      const validationRules = await strapi.plugin('reportes').service('schema').getValidationRules(uid);
      
      // Crear nuevo workbook
      const workbook = XLSX.utils.book_new();
      
      // Crear hoja principal con datos
      const dataSheet = this.createDataSheet(validationRules);
      XLSX.utils.book_append_sheet(workbook, dataSheet, 'Datos');
      
      // Crear hoja de instrucciones
      const instructionsSheet = this.createInstructionsSheet(validationRules);
      XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');
      
      // Generar buffer
      const buffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
      });
      
      return {
        buffer,
        filename: `plantilla_${validationRules.collectionType.uid.replace('api::', '').replace('.', '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };

    } catch (error) {
      strapi.log.error('Error generating template:', error);
      throw error;
    }
  },

  /**
   * Crea la hoja principal con headers y ejemplos
   */
  createDataSheet(validationRules) {
    const headers = validationRules.fields.map(field => field.name);
    const exampleRow = validationRules.fields.map(field => this.generateExampleValue(field));
    
    // Crear datos para la hoja
    const data = [
      headers,
      exampleRow,
      // Fila vacía para que el usuario empiece a llenar
      new Array(headers.length).fill('')
    ];
    
    // Crear worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    return worksheet;
  },

  /**
   * Crea la hoja de instrucciones
   */
  createInstructionsSheet(validationRules) {
    const instructions = [
      ['INSTRUCCIONES DE USO'],
      [''],
      ['1. Esta plantilla está diseñada para importar datos al Collection Type:'],
      [`   ${validationRules.collectionType.displayName} (${validationRules.collectionType.uid})`],
      [''],
      ['2. IMPORTANTE:'],
      ['   • NO modifique los nombres de las columnas (headers)'],
      ['   • La fila 2 contiene ejemplos - puede eliminarla antes de importar'],
      ['   • Los campos marcados como "Requerido" son obligatorios'],
      ['   • Respete los tipos de datos y formatos indicados'],
      [''],
      ['3. Campos disponibles:'],
      [`   • Total de campos: ${validationRules.totalFields}`],
      [`   • Campos importables: ${validationRules.importableFields}`],
      [`   • Campos requeridos: ${validationRules.requiredFields}`]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(instructions);
    return worksheet;
  },

  /**
   * Genera un valor de ejemplo para un campo
   */
  generateExampleValue(field) {
    switch (field.type) {
      case 'string':
        if (field.name.toLowerCase().includes('nombre')) return 'Juan Pérez';
        if (field.name.toLowerCase().includes('codigo')) return 'ABC123';
        return 'Texto ejemplo';
      
      case 'text':
        return 'Este es un texto largo de ejemplo.';
      
      case 'email':
        return 'usuario@ejemplo.com';
      
      case 'integer':
        return '123';
      
      case 'float':
      case 'decimal':
        return '123.45';
      
      case 'boolean':
        return 'true';
      
      case 'date':
        return new Date().toISOString().split('T')[0];
      
      default:
        return 'ejemplo';
    }
  }
});