// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of purpleteam.

// purpleteam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// purpleteam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with purpleteam. If not, see <https://www.gnu.org/licenses/>.

const convict = require('convict');
const { duration } = require('convict-format-with-moment');
const { url } = require('convict-format-with-validator');
const path = require('path');

convict.addFormat(duration);
convict.addFormat(url);

const schema = {
  env: {
    doc: 'The application environment.',
    format: ['cloud', 'local', 'test'],
    default: 'cloud',
    env: 'NODE_ENV'
  },
  logger: {
    level: {
      doc: 'Write all log events with this level and below. Syslog levels used: https://github.com/winstonjs/winston#logging-levels',
      format: ['emerg', 'alert', 'crit', 'error', 'warning', 'notice', 'info', 'debug'],
      default: 'info'
    }
  },
  processMonitoring: {
    on: {
      doc: 'Whether or not to capture and log process events.',
      format: 'Boolean',
      default: false
    },
    interval: {
      doc: 'The interval in milliseconds to capture and log the process events.',
      format: 'duration',
      default: 10000
    }
  },
  host: {
    port: {
      doc: 'The port of this host.',
      format: 'port',
      default: 2000,
      env: 'PORT'
    },
    host: {
      doc: 'The IP address or hostname of this host.',
      format: String,
      default: '240.0.0.0'
    }
  },
  redis: {
    clientCreationOptions: {
      doc: 'The options used for creating the redis client.',
      format: (val) => typeof val === 'object',
      default: {
        port: 6379,
        host: 'redis'
        // "host": "172.17.0.2" // host networking or not running in container
      }
    }
  },
  sut: {
    browser: {
      doc: 'The type of browser to run tests through.',
      format: ['chrome', 'firefox'],
      default: 'chrome'
    }
  },
  testers: {
    app: {
      name: 'app',
      url: {
        doc: 'The url of the  app-scanner microservice.',
        format: 'url',
        default: 'https://127.0.0.1:1000'
      },
      active: {
        doc: 'Whether or not the app-scanner microservice is active.',
        format: 'Boolean',
        default: true
      },
      testPlanRoute: '/test-plan',
      initTesterRoute: '/init-tester',
      startTesterRoute: '/start-tester',
      resetTesterRoute: '/reset-tester'
    },
    server: {
      name: 'server',
      url: {
        doc: 'The url of the  server-scanner microservice.',
        format: 'url',
        default: 'https://127.0.0.1:1000'
      },
      active: {
        doc: 'Whether or not the server-scanner microservice is active.',
        format: 'Boolean',
        default: true
      },
      testPlanRoute: '/test-plan',
      initTesterRoute: '/init-tester',
      startTesterRoute: '/start-tester',
      resetTesterRoute: '/reset-tester'
    },
    tls: {
      name: 'tls',
      url: {
        doc: 'The url of the  tls-scanner microservice.',
        format: 'url',
        default: 'https://127.0.0.1:1000'
      },
      active: {
        doc: 'Whether or not the tls-scanner microservice is active.',
        format: 'Boolean',
        default: true
      },
      testPlanRoute: '/test-plan',
      initTesterRoute: '/init-tester',
      startTesterRoute: '/start-tester',
      resetTesterRoute: '/reset-tester'
    }
  },
  job: {
    version: {
      doc: 'The version of the Job accepted by this API.',
      format: ['0.1.0-alpha.1', '1.0.0-alpha.3', '2.0.0-alpha.3'],
      default: '2.0.0-alpha.3'
    }
  },
  outcomes: {
    dir: {
      doc: 'The directory that stores Tester results and Emissary reports.',
      format: String,
      default: '/var/log/purpleteam/outcomes/'
    },
    fileName: {
      doc: 'The name of the archive file containing all of the Tester outcomes (results, reports)',
      format: String,
      default: 'outcomes.zip'
    },
    compressionLvl: {
      doc: 'The compression level of the outcomes archive file',
      format: ['-0', '-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9'],
      default: '-6'
    }
  },
  testerFeedbackComms: {
    medium: {
      doc: 'The messaging medium used for tester[feedback] events. Both Server Sent Events and Long Polling are supported in the local environment, but only Long Polling is supported in the cloud environment due to AWS limitations',
      format: ['sse', 'lp'],
      default: 'lp'
    },
    longPoll: {
      timeout: {
        doc: 'A double that expresses seconds to wait for blocking Redis commands. We need to timeout well before the AWS Api Gateway timeout.',
        format: Number,
        default: 20.0
      }
    }
  },
  coolDown: {
    timeout: {
      doc: 'The duration in milliseconds between Test Runs before another test command can be initiated. Important to make sure cleanup has occurred before starting another Test Run. In the cloud ECS requires a longer cool-down period before restarting S2 Tasks.',
      format: 'duration',
      default: 15000
    }
  }
};

const config = convict(schema);
config.loadFile(path.join(__dirname, `config.${process.env.NODE_ENV}.json`));
config.validate();

module.exports = config;
