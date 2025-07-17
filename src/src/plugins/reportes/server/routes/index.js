'use strict';

console.log('🛣️ [REPORTES] Cargando TODAS las rutas V5...');

module.exports = {
  'content-api': {
    type: 'content-api',
    routes: [
        {
        method: 'POST',
        path: '/import',
        handler: 'reportes.importFile',
        config: {
            auth: false, // Temporal para testing
        }
        },
      {
        method: 'GET',
        path: '/test',
        handler: async (ctx) => {
          console.log('🎯 [REPORTES] ¡Ruta de prueba funcionando!');
          ctx.send({ 
            success: true,
            message: '¡Plugin Reportes funcionando con formato V5!',
            timestamp: new Date().toISOString()
          });
        },
        config: {
          auth: false,
        }
      },
     
      {
        method: 'GET',
        path: '/collections',
        handler: 'reportes.getCollections',
        config: {
          auth: false,
        }
      },

      {
        method: 'GET',
        path: '/collections/:uid/rules',
        handler: 'reportes.getValidationRules',
        config: {
            auth: false, // Temporal para testing
        }
      },

      {
        method: 'GET',
        path: '/collections/:uid/rules-test',
        handler: async (ctx) => {
            console.log('🎯 [REPORTES] ¡Ruta rules-test funcionando!');
            console.log('📋 [REPORTES] UID recibido:', ctx.params.uid);
            ctx.send({ 
            success: true,
            message: 'Ruta de reglas funcionando',
            collectionUID: ctx.params.uid,
            mockRules: {
                collectionType: {
                uid: ctx.params.uid,
                displayName: ctx.params.uid === 'api::municipio.municipio' ? 'Municipios' : 'Unknown'
                },
                fields: [
                {
                    name: 'nombre',
                    type: 'string',
                    required: true,
                    validations: ['Máximo 255 caracteres']
                },
                {
                    name: 'codigo',
                    type: 'string', 
                    required: true,
                    validations: ['Exactamente 5 caracteres']
                }
                ],
                totalFields: 2,
                importableFields: 2,
                requiredFields: 2
            }
            });
        },
        config: {
            auth: false,
        }
        },

        {
  method: 'POST',
  path: '/import-test',
  handler: async (ctx) => {
    console.log('🎯 [REPORTES] ¡Ruta import-test funcionando!');
    console.log('📋 [REPORTES] Files:', ctx.request.files);
    console.log('📋 [REPORTES] Body:', ctx.request.body);
    
    ctx.send({ 
      success: true,
      message: 'Importación de prueba funcionando',
      totalRows: 42,
      mockData: {
        file: ctx.request.files?.file?.name || 'No file',
        collectionType: ctx.request.body?.collectionType || 'No collection'
      }
    });
  },
  config: {
    auth: false,
  }
},

    ]
  },
  
  'admin': {
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/collections',
        handler: 'reportes.getCollections',
        config: {
          policies: []
        }
      }
    ]
  }
};