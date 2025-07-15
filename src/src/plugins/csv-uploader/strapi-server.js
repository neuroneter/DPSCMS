const register = require('./server/register');
const bootstrap = require('./server/bootstrap');
const controllers = require('./server/controllers');
const routes = require('./server/routes');
const services = require('./server/services');

module.exports = {
  register,
  bootstrap,
  controllers,
  routes,
  services,
};