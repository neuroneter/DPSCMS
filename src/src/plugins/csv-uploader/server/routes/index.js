'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/config/apis',
    handler: 'csv-controller.getAvailableApis',
    config: {
      policies: []
    }
  },
  {
    method: 'GET',
    path: '/config/api/:id',
    handler: 'csv-controller.getApiDetails',
    config: {
      policies: []
    }
  },
  {
    method: 'POST',
    path: '/upload',
    handler: 'csv-controller.uploadCsv',
    config: {
      policies: []
    }
  }
];