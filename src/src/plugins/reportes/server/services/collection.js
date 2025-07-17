'use strict';

module.exports = ({ strapi }) => ({
  
  /**
   * Obtiene todos los Collection Types disponibles para el usuario actual
   * Solo muestra aquellos donde el usuario tiene permisos de escritura
   */
  async getAvailableCollections(user) {
    try {
      const contentTypes = strapi.contentTypes;
      const availableCollections = [];

      for (const [uid, contentType] of Object.entries(contentTypes)) {
        // Solo procesar Collection Types de la API (no admin ni plugins)
        if (!uid.startsWith('api::')) continue;
        
        // Verificar si es un Collection Type (no Single Type)
        if (contentType.kind !== 'collectionType') continue;

        // Verificar permisos del usuario
        const hasPermission = await this.checkUserPermissions(user, uid, 'create');
        
        if (hasPermission) {
          availableCollections.push({
            uid,
            displayName: contentType.info.displayName,
            singularName: contentType.info.singularName,
            pluralName: contentType.info.pluralName,
            description: contentType.info.description || '',
            attributes: Object.keys(contentType.attributes),
            hasTimestamps: contentType.options?.timestamps !== false,
            hasDraftAndPublish: contentType.options?.draftAndPublish === true
          });
        }
      }

      return availableCollections.sort((a, b) => 
        a.displayName.localeCompare(b.displayName)
      );

    } catch (error) {
      strapi.log.error('Error getting available collections:', error);
      throw error;
    }
  },

  /**
   * Verifica si el usuario tiene permisos específicos en un Collection Type
   */
  async checkUserPermissions(user, contentTypeUID, action = 'create') {
    try {
      // Si no hay usuario (modo público), denegar
      if (!user) return false;

      // Si es super admin, permitir todo
      if (user.isActive && user.roles?.some(role => role.type === 'root')) {
        return true;
      }

      // Para simplificar en esta fase, permitir a usuarios activos
      // TODO: Implementar verificación de permisos más específica
      return user.isActive === true;

    } catch (error) {
      strapi.log.error('Error checking user permissions:', error);
      return false; // Por seguridad, denegar si hay error
    }
  },

  /**
   * Obtiene el schema completo de un Collection Type específico
   */
  async getCollectionSchema(uid) {
    try {
      const contentType = strapi.contentTypes[uid];
      
      if (!contentType) {
        throw new Error(`Collection Type '${uid}' no encontrado`);
      }

      if (contentType.kind !== 'collectionType') {
        throw new Error(`'${uid}' no es un Collection Type válido`);
      }

      return {
        uid,
        info: contentType.info,
        options: contentType.options,
        attributes: contentType.attributes,
        schema: contentType
      };

    } catch (error) {
      strapi.log.error('Error getting collection schema:', error);
      throw error;
    }
  },

  /**
   * Obtiene información detallada de atributos para validación
   */
  getAttributeDetails(attributes) {
    const details = [];

    for (const [name, attribute] of Object.entries(attributes)) {
      // Omitir campos del sistema
      if (['id', 'createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy'].includes(name)) {
        continue;
      }

      const detail = {
        name,
        type: attribute.type,
        required: attribute.required === true,
        unique: attribute.unique === true,
        private: attribute.private === true,
        validations: []
      };

      // Agregar validaciones específicas según el tipo
      switch (attribute.type) {
        case 'string':
        case 'text':
        case 'email':
          if (attribute.minLength) {
            detail.validations.push(`Mínimo ${attribute.minLength} caracteres`);
          }
          if (attribute.maxLength) {
            detail.validations.push(`Máximo ${attribute.maxLength} caracteres`);
          }
          if (attribute.regex) {
            detail.validations.push(`Debe coincidir con: ${attribute.regex}`);
          }
          break;

        case 'integer':
        case 'biginteger':
        case 'float':
        case 'decimal':
          if (attribute.min !== undefined) {
            detail.validations.push(`Valor mínimo: ${attribute.min}`);
          }
          if (attribute.max !== undefined) {
            detail.validations.push(`Valor máximo: ${attribute.max}`);
          }
          break;

        case 'enumeration':
          if (attribute.enum && attribute.enum.length > 0) {
            detail.validations.push(`Opciones válidas: ${attribute.enum.join(', ')}`);
          }
          break;

        case 'relation':
          detail.validations.push(`Relación con: ${attribute.target}`);
          if (attribute.relation) {
            detail.validations.push(`Tipo: ${attribute.relation}`);
          }
          break;
      }

      // Agregar valor por defecto si existe
      if (attribute.default !== undefined) {
        detail.validations.push(`Valor por defecto: ${attribute.default}`);
      }

      details.push(detail);
    }

    return details;
  }
});