'use strict';

console.log('🚀 [REPORTES] Plugin iniciando correctamente...');

module.exports = () => {
  console.log('🔥 [REPORTES] Registrando plugin con formato V5...');
  
  return {
    routes: require('./server/routes'),
    controllers: require('./server/controllers'),
    services: require('./server/services'),
  };
};