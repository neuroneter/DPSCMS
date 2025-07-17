'use strict';

module.exports = ({ strapi }) => ({
  
  /**
   * GET /api/reportes/collections
   * Obtiene Collection Types disponibles para el usuario actual
   */
  async getCollections(ctx) {
  try {
    // TEMPORAL: Comentar verificación de usuario para testing
    // const user = ctx.state.user;
    // if (!user) {
    //   return ctx.unauthorized('Usuario no autenticado');
    // }

    console.log('🔍 [REPORTES] Consultando Collection Types reales de Strapi...');

    const collectionService = strapi.plugin('reportes').service('collection');
    
    // Usar un usuario dummy para testing
    const dummyUser = { isActive: true, roles: [{ type: 'root' }] };
    const collections = await collectionService.getAvailableCollections(dummyUser);
    
    console.log('✅ [REPORTES] Collection Types encontrados:', collections.length);
    console.log('📋 [REPORTES] Collection Types:', collections.map(c => c.displayName));
    
    ctx.send({
      data: collections,
      meta: {
        total: collections.length,
        source: 'Strapi real (sin auth)',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [REPORTES] Error in getCollections:', error);
    ctx.throw(500, `Error al obtener Collection Types: ${error.message}`);
  }
},

async getValidationRules(ctx) {
  try {
    const { uid } = ctx.params;
    
    console.log(`🔍 [REPORTES] Obteniendo reglas REALES para: ${uid}`);

    // TEMPORAL: Sin verificación de usuario para testing
    const schemaService = strapi.plugin('reportes').service('schema');
    
    // Verificar que el Collection Type existe
    const contentType = strapi.contentTypes[uid];
    if (!contentType) {
      console.log(`❌ [REPORTES] Collection Type no encontrado: ${uid}`);
      return ctx.throw(404, `Collection Type '${uid}' no encontrado`);
    }

    console.log(`✅ [REPORTES] Collection Type encontrado: ${contentType.info.displayName}`);
    
    const validationRules = await schemaService.getValidationRules(uid);
    
    console.log(`✅ [REPORTES] Reglas obtenidas para ${uid}:`, {
      totalFields: validationRules.totalFields,
      importableFields: validationRules.importableFields,
      requiredFields: validationRules.requiredFields,
      fieldsNames: validationRules.fields.map(f => f.name)
    });
    
    ctx.send({
      data: validationRules,
      meta: {
        collectionType: uid,
        timestamp: new Date().toISOString(),
        source: 'Schema REAL de Strapi'
      }
    });

  } catch (error) {
    console.error(`❌ [REPORTES] Error getting validation rules for ${ctx.params.uid}:`, error);
    ctx.throw(500, `Error al obtener reglas de validación: ${error.message}`);
  }
},

  /**
   * GET /api/reportes/collections/:uid/template
   * Genera y descarga plantilla Excel para un Collection Type
   */
  async downloadTemplate(ctx) {
    try {
      const { uid } = ctx.params;
      const user = ctx.state.user;
      
      if (!user) {
        return ctx.unauthorized('Usuario no autenticado');
      }

      // Verificar permisos
      const collectionService = strapi.plugin('reportes').service('collection');
      const hasPermission = await collectionService.checkUserPermissions(user, uid, 'create');
      
      if (!hasPermission) {
        return ctx.forbidden('No tienes permisos para generar plantillas de este Collection Type');
      }

      const templateService = strapi.plugin('reportes').service('template');
      const template = await templateService.generateTemplate(uid);
      
      ctx.set('Content-Type', template.mimeType);
      ctx.set('Content-Disposition', `attachment; filename="${template.filename}"`);
      ctx.body = template.buffer;

      // Log para auditoría
      strapi.log.info(`Template downloaded: ${template.filename} by ${user.email}`);

    } catch (error) {
      strapi.log.error('Error in downloadTemplate:', error);
      
      if (error.message.includes('no encontrado')) {
        ctx.throw(404, error.message);
      } else {
        ctx.throw(500, 'Error al generar plantilla');
      }
    }
  },

  /**
   * POST /api/reportes/import
   * Procesa e importa archivo CSV/Excel
   */
  async importFile(ctx) {
  try {
    console.log('🚀 [REPORTES] Iniciando importación REAL...');

    const file = ctx.request.files?.file;
    const collectionType = ctx.request.body?.collectionType;
    const csvSeparator = ctx.request.body?.csvSeparator || ','; // ← AGREGAR ESTA LÍNEA

    console.log(`🔍 [REPORTES] Separador especificado: "${csvSeparator}"`);

    if (!file) {
      return ctx.badRequest('No se ha enviado ningún archivo');
    }

    if (!collectionType) {
      return ctx.badRequest('No se ha especificado el Collection Type');
    }

    console.log(`📄 [REPORTES] Procesando: ${file.originalFilename} (${file.size} bytes)`);
    console.log(`🎯 [REPORTES] Para Collection: ${collectionType}`);

    // Leer contenido del archivo
    const fs = require('fs');
    const path = require('path');
    
    let fileContent;
    try {
      fileContent = fs.readFileSync(file.filepath, 'utf8');
      console.log('📖 [REPORTES] Archivo leído exitosamente');
      console.log('📄 [REPORTES] Primeros 200 caracteres:', fileContent.substring(0, 200));
    } catch (readError) {
      console.error('❌ [REPORTES] Error leyendo archivo:', readError);
      return ctx.throw(500, 'Error leyendo el archivo');
    }

    // Parsear CSV simple
    const lines = fileContent.split('\n').filter(line => line.trim());
    console.log(`📊 [REPORTES] Total de líneas: ${lines.length}`);

    if (lines.length === 0) {
      return ctx.badRequest('El archivo está vacío');
    }

    // Primera línea = headers
    const headers = lines[0].split(csvSeparator).map(h => h.trim().replace(/"/g, ''));
    console.log('📋 [REPORTES] Headers encontrados:', headers);

    // Resto de líneas = datos
    const dataLines = lines.slice(1);
    console.log(`📊 [REPORTES] Filas de datos: ${dataLines.length}`);

    // Procesar cada línea
    let importedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < dataLines.length; i++) {
      const lineNumber = i + 2; // +2 porque empezamos en línea 1 y saltamos headers
      const line = dataLines[i].trim();
      
      if (!line) {
        console.log(`⏭️ [REPORTES] Saltando línea vacía: ${lineNumber}`);
        continue;
      }

      try {
        // Parsear línea
        const values = line.split(csvSeparator).map(v => v.trim().replace(/"/g, ''));
        
        if (values.length !== headers.length) {
          errorCount++;
          errors.push({
            row: lineNumber,
            message: `Número incorrecto de columnas. Esperado: ${headers.length}, Encontrado: ${values.length}`
          });
          continue;
        }

        // Crear objeto
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });

        console.log(`📝 [REPORTES] Línea ${lineNumber}:`, rowData);

        // Validaciones básicas
        let hasErrors = false;

        // Verificar campos requeridos básicos
        if (!rowData.nombre || rowData.nombre.trim() === '') {
          errorCount++;
          errors.push({
            row: lineNumber,
            message: 'El campo "nombre" es requerido'
          });
          hasErrors = true;
        }

        if (!rowData.codigo || rowData.codigo.trim() === '') {
          errorCount++;
          errors.push({
            row: lineNumber,
            message: 'El campo "codigo" es requerido'
          });
          hasErrors = true;
        }

        if (!hasErrors) {
        try {
            // IMPORTACIÓN REAL A STRAPI
            console.log(`💾 [REPORTES] Guardando en Strapi:`, rowData);
            
            const createdEntry = await strapi.entityService.create(collectionType, {
            data: rowData
            });
            
            console.log(`✅ [REPORTES] Línea ${lineNumber} guardada con ID: ${createdEntry.id}`);
            importedCount++;
            
        } catch (saveError) {
            console.error(`❌ [REPORTES] Error guardando línea ${lineNumber}:`, saveError);
            errorCount++;
            errors.push({
            row: lineNumber,
            message: `Error guardando en base de datos: ${saveError.message}`
            });
        }
        }

      } catch (lineError) {
        console.error(`❌ [REPORTES] Error en línea ${lineNumber}:`, lineError);
        errorCount++;
        errors.push({
          row: lineNumber,
          message: `Error procesando línea: ${lineError.message}`
        });
      }
    }

    const results = {
      imported: importedCount,
      errors: errorCount,
      skipped: 0,
      total: dataLines.length,
      timestamp: new Date().toISOString()
    };

    console.log('✅ [REPORTES] Procesamiento completado:', results);

    ctx.send({
      data: {
        results: results,
        errors: errors.slice(0, 50) // Limitar a 50 errores para la UI
      },
      meta: {
        file: file.originalFilename,
        collectionType: collectionType,
        headers: headers,
        totalLines: lines.length,
        timestamp: new Date().toISOString(),
        source: 'Procesamiento REAL de CSV'
      }
    });

  } catch (error) {
    console.error('❌ [REPORTES] Error in importFile:', error);
    ctx.throw(500, `Error durante la importación: ${error.message}`);
  }
},


  /**
   * GET /api/reportes/stats
   * Obtiene estadísticas de importación del usuario
   */
  async getImportStats(ctx) {
    try {
      const user = ctx.state.user;
      
      if (!user) {
        return ctx.unauthorized('Usuario no autenticado');
      }

      // Por ahora retornamos estadísticas básicas
      ctx.send({
        data: {
          totalImports: 0,
          lastImport: null,
          collectionTypes: {}
        }
      });

    } catch (error) {
      strapi.log.error('Error in getImportStats:', error);
      ctx.throw(500, 'Error al obtener estadísticas');
    }
  }
});