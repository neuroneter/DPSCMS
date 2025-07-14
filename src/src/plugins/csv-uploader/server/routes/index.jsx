module.exports = [
  // ... rutas anteriores ...
  
  {
    method: 'GET',
    path: '/config/field-options',
    handler: 'config.getFieldOptions',
    config: {
      policies: []
    }
  },
  {
    method: 'GET',
    path: '/config/api-details/:id',
    handler: 'config.getApiDetails',
    config: {
      policies: []
    }
  }
];