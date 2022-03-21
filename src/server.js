// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

import Hapi from '@hapi/hapi';
import hapiJsonApi from '@gar/hapi-json-api';
import susie from 'susie';
import Inert from '@hapi/inert';
import { init as initPtLogger } from 'purpleteam-logger';
import config from '../config/config.js';
import { hapiEventHandler } from './plugins/index.js';
import orchestration from './api/orchestration/index.js';
import { serverStart } from './api/orchestration/subscribers/testerWatcher.js';

const log = initPtLogger(config.get('logger'));
const server = Hapi.server({ port: config.get('host.port'), host: config.get('host.host') });

const testerWatcher = serverStart({
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
      env: config.get('env'),
      coolDownTimeout: config.get('coolDown.timeout')
    }
  }
];

export default {
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
