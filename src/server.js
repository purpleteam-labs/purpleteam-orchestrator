const config = require('../config/config');
const Hapi = require('hapi');
const test = require('./api/test');

const server = Hapi.server({ port: config.get('host.port'), host: config.get('host.iP') });

const infrastructuralPlugins = [];
const domainPlugins = [
  {
    plugin: test,
    options: 'Options for test'
  }
];


module.exports = {

  registerPlugins: async () => {
    // Todo: KC: Add host header as `vhost` to the routes of the optional options object passed to `server.register`.
    // https://hapijs.com/tutorials/plugins#user-content-registration-options

    await server.register(infrastructuralPlugins.concat(domainPlugins));
  },
  start: async () => {
    await server.start();
    return server;
  }

};
