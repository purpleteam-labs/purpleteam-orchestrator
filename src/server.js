const Hapi = require('@hapi/hapi');
const hapiJsonApi = require('@gar/hapi-json-api');
const susie = require('susie');
const good = require('@hapi/good');
const Inert = require('@hapi/inert');
const config = require('config/config');
const orchestration = require('src/api/orchestration');

const server = Hapi.server({ port: config.get('host.port'), host: config.get('host.host') });
const log = require('purpleteam-logger').init(config.get('logger'));

const testerWatcher = require('src/api/orchestration/subscribers/testerWatcher').init({ log, redis: config.get('redis.clientCreationOptions') });

// hapi-good-winstone: https://github.com/alexandrebodin/hapi-good-winston
//    default levels: https://github.com/alexandrebodin/hapi-good-winston/blob/master/lib/index.js
const reporters = {
  local: {
    winstonReporter: [{
      module: 'hapi-good-winston',
      name: 'goodWinston',
      args: [log, { levels: { ops: 'debug' } }]
    }]
  },
  cloud: {
    winstonReporter: [{
      module: 'hapi-good-winston',
      name: 'goodWinston',
      args: [log, { levels: { ops: 'notice', response: 'notice', log: 'notice', request: 'notice' } }]
    }]
  }
};


const infrastructuralPlugins = [
  susie,
  {
    plugin: hapiJsonApi,
    options: {}
  },
  {
    plugin: good,
    options: { reporters: reporters[process.env.NODE_ENV] }
  },
  Inert
];
const domainPlugins = [
  {
    plugin: orchestration,
    options: {
      log,
      testers: config.get('testers'),
      testerWatcher,
      outcomes: config.get('outcomes')
    }
  }
];


module.exports = {

  registerPlugins: async () => {
    // Todo: KC: Add host header as `vhost` to the routes of the optional options object passed to `server.register`.
    // https://hapijs.com/tutorials/plugins#user-content-registration-options

    await server.register(infrastructuralPlugins.concat(domainPlugins));
    log.info('Server registered.', { tags: ['startup'] });
  },
  start: async () => {
    await server.start();
    log.info('Server started.', { tags: ['startup'] });
    return server;
  }

};
