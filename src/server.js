// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of PurpleTeam.

// PurpleTeam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// PurpleTeam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with PurpleTeam. If not, see <https://www.gnu.org/licenses/>.

const Hapi = require('@hapi/hapi');
const hapiJsonApi = require('@gar/hapi-json-api');
const susie = require('susie');
const Inert = require('@hapi/inert');
const config = require('config/config');
const { hapiEventHandler } = require('src/plugins/');
const orchestration = require('src/api/orchestration');

const server = Hapi.server({ port: config.get('host.port'), host: config.get('host.host') });
const log = require('purpleteam-logger').init(config.get('logger'));

const testerWatcher = require('src/api/orchestration/subscribers/testerWatcher').serverStart({
  log,
  redis: config.get('redis.clientCreationOptions'),
  testerFeedbackCommsMedium: config.get('testerFeedbackComms.medium'),
  longPollTimeout: config.get('testerFeedbackComms.longPoll.timeout')
});

const plugins = [
  susie,
  {
    plugin: hapiJsonApi,
    options: {}
  },
  Inert,
  {
    plugin: hapiEventHandler,
    options: {
      log,
      logLevels: config.getSchema()._cvtProperties.logger._cvtProperties.level.format, // eslint-disable-line no-underscore-dangle
      processMonitoring: config.get('processMonitoring')
    }
  },
  {
    plugin: orchestration,
    options: {
      log,
      testers: config.get('testers'),
      testerWatcher,
      outcomes: config.get('outcomes'),
      env: config.get('env')
    }
  }
];

module.exports = {

  registerPlugins: async () => {
    // Todo: KC: Add host header as `vhost` to the routes of the optional options object passed to `server.register`.
    // https://hapijs.com/tutorials/plugins#user-content-registration-options

    await server.register(plugins);
    log.info('Server registered.', { tags: ['startup'] });
  },
  start: async () => {
    await server.start();
    log.info('Server started.', { tags: ['startup'] });
    return server;
  }

};
