'use strict';

module.exports = ({ strapi }) => ({
  
  /**
   * Extrae las reglas de validación de un Collection Type
   */
 async getValidationRules(uid) {
  try {
    console.log(`🔍 [SCHEMA] Getting validation rules for: ${uid}`);
    
    const contentType = strapi.contentTypes[uid];
    if (!contentType) {
      throw new Error(`Content Type '${uid}' not found`);
    }

    const attributes = contentType.attributes;
    
    // Lista simple de campos a excluir
    const excludeFields = ['id', 'createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy', 'locale', 'localizations'];
    
    const importableFields = [];
    let requiredCount = 0;

    for (const [fieldName, fieldConfig] of Object.entries(attributes)) {
      // Saltar campos del sistema
      if (excludeFields.includes(fieldName)) {
        console.log(`⏭️ [SCHEMA] Excluyendo campo: ${fieldName}`);
        continue;
      }

      // Saltar relaciones y campos complejos por ahora
      if (fieldConfig.type === 'relation' || fieldConfig.type === 'media' || fieldConfig.type === 'component' || fieldConfig.type === 'dynamiczone') {
        console.log(`⏭️ [SCHEMA] Excluyendo campo complejo: ${fieldName} (${fieldConfig.type})`);
        continue;
      }

      const isRequired = fieldConfig.required === true;
      if (isRequired) requiredCount++;

      // VALIDACIONES EXPANDIDAS
      const validations = [];
      
      // Validaciones de longitud
      if (fieldConfig.minLength) validations.push(`Mínimo ${fieldConfig.minLength} caracteres`);
      if (fieldConfig.maxLength) validations.push(`Máximo ${fieldConfig.maxLength} caracteres`);
      
      // Validaciones numéricas
      if (fieldConfig.min !== undefined) validations.push(`Valor mínimo: ${fieldConfig.min}`);
      if (fieldConfig.max !== undefined) validations.push(`Valor máximo: ${fieldConfig.max}`);
      
      // Validaciones de unicidad
      if (fieldConfig.unique) validations.push('Debe ser único');
      
      // REGEX/PATTERN - ¡AQUÍ ESTÁ LO QUE FALTABA!
      if (fieldConfig.regex) validations.push(`Patrón RegExp: ${fieldConfig.regex}`);
      if (fieldConfig.pattern) validations.push(`Patrón: ${fieldConfig.pattern}`);
      
      // Valores enumerados
      if (fieldConfig.enum && Array.isArray(fieldConfig.enum)) {
        validations.push(`Valores permitidos: ${fieldConfig.enum.join(', ')}`);
      }
      
      // Validaciones específicas por tipo
      if (fieldConfig.type === 'email') validations.push('Formato de email válido');
      if (fieldConfig.type === 'uid') validations.push('Solo letras, números, guiones y guiones bajos');
      
      // Validaciones personalizadas (si existen)
      if (fieldConfig.customField) validations.push('Campo personalizado');

      importableFields.push({
        name: fieldName,
        type: fieldConfig.type,
        required: isRequired,
        validations: validations
      });

      console.log(`✅ [SCHEMA] Campo agregado: ${fieldName} (${fieldConfig.type}) - Validaciones: ${validations.length}`);
      if (validations.length > 0) {
        console.log(`   🔒 Validaciones: ${validations.join(', ')}`);
      }
    }

    const result = {
      collectionType: {
        uid: uid,
        displayName: contentType.info.displayName,
        singularName: contentType.info.singularName,
        pluralName: contentType.info.pluralName
      },
      fields: importableFields,
      totalFields: Object.keys(attributes).length,
      importableFields: importableFields.length,
      requiredFields: requiredCount
    };

    console.log(`📊 [SCHEMA] Resultado: ${result.importableFields} campos importables de ${result.totalFields} totales`);

    return result;

  } catch (error) {
    console.error(`❌ [SCHEMA] Error:`, error);
    throw error;
  }
},

  /**
   * Valida un registro individual contra el schema
   */
  async validateRecord(data, uid, rowNumber = null) {
    try {
      const schema = await strapi.plugin('reportes').service('collection').getCollectionSchema(uid);
      const errors = [];

      for (const [fieldName, attribute] of Object.entries(schema.attributes)) {
        // Omitir campos del sistema
        if (['id', 'createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy'].includes(fieldName)) {
          continue;
        }

        const value = data[fieldName];
        const fieldErrors = this.validateField(fieldName, value, attribute, rowNumber);
        
        errors.push(...fieldErrors);
      }

      return {
        isValid: errors.length === 0,
        errors,
        data: this.sanitizeRecord(data, schema)
      };

    } catch (error) {
      strapi.log.error('Error validating record:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Error interno de validación',
          row: rowNumber,
          type: 'validation_error'
        }],
        data: null
      };
    }
  },

  /**
   * Valida un campo individual
   */
  validateField(fieldName, value, attribute, rowNumber) {
    const errors = [];
    const isEmpty = value === null || value === undefined || value === '';

    // Verificar campo requerido
    if (attribute.required && isEmpty) {
      errors.push({
        field: fieldName,
        message: `El campo '${fieldName}' es obligatorio`,
        row: rowNumber,
        type: 'required_field',
        value: value
      });
      return errors; // Si es requerido y está vacío, no validar más
    }

    // Si está vacío y no es requerido, no validar más
    if (isEmpty) return errors;

    // Validar según el tipo
    switch (attribute.type) {
      case 'string':
      case 'text':
        if (attribute.minLength && String(value).length < attribute.minLength) {
          errors.push({
            field: fieldName,
            message: `'${fieldName}' debe tener al menos ${attribute.minLength} caracteres`,
            row: rowNumber,
            type: 'min_length',
            value: value
          });
        }
        if (attribute.maxLength && String(value).length > attribute.maxLength) {
          errors.push({
            field: fieldName,
            message: `'${fieldName}' no puede tener más de ${attribute.maxLength} caracteres`,
            row: rowNumber,
            type: 'max_length',
            value: value
          });
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          errors.push({
            field: fieldName,
            message: `'${fieldName}' debe ser un email válido`,
            row: rowNumber,
            type: 'invalid_email',
            value: value
          });
        }
        break;

      case 'integer':
      case 'biginteger':
        const numValue = Number(value);
        if (isNaN(numValue) || !Number.isInteger(numValue)) {
          errors.push({
            field: fieldName,
            message: `'${fieldName}' debe ser un número entero`,
            row: rowNumber,
            type: 'invalid_integer',
            value: value
          });
        }
        break;
    }

    return errors;
  },

  /**
   * Limpia y transforma un registro para que sea compatible con Strapi
   */
  sanitizeRecord(data, schema) {
    const sanitized = {};

    for (const [fieldName, attribute] of Object.entries(schema.attributes)) {
      // Omitir campos del sistema
      if (['id', 'createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy'].includes(fieldName)) {
        continue;
      }

      const value = data[fieldName];
      
      if (value === null || value === undefined || value === '') {
        // Solo incluir si no es requerido
        if (!attribute.required) {
          sanitized[fieldName] = null;
        }
        continue;
      }

      // Transformar según el tipo
      switch (attribute.type) {
        case 'integer':
        case 'biginteger':
          sanitized[fieldName] = parseInt(value, 10);
          break;
        
        case 'float':
        case 'decimal':
          sanitized[fieldName] = parseFloat(value);
          break;
        
        case 'boolean':
          const boolValue = String(value).toLowerCase();
          sanitized[fieldName] = ['true', '1', 'yes', 'si', 'sí'].includes(boolValue);
          break;
        
        default:
          sanitized[fieldName] = value;
      }
    }

    return sanitized;
  }
});