const convict = require('convict');
const path = require('path');

console.log(`Running in environment ${process.env.NODE_ENV}`); // eslint-disable-line
const schema = {
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'production',
    env: 'NOE_ENV'
  },
  logger: {
    level: {
      doc: 'Write all log events with this level and below. Syslog levels used: https://github.com/winstonjs/winston#logging-levels',
      format: ['emerg', 'alert', 'crit', 'error', 'warning', 'notice', 'info', 'debug'],
      default: 'notice'
    }
  },
  host: {
    port: {
      doc: 'The port of this host.',
      format: 'port',
      default: 2000,
      env: 'PORT'
    },
    ip: {
      doc: 'The IP address of this host.',
      format: 'ipaddress',
      default: '240.0.0.0'
    }
  },
  redis: {
    clientCreationOptions: {
      doc: 'The options used for creating the redis client.',
      format: val => typeof val === 'object',
      default: {}
    }
  },
  sut: {
    browser: {
      doc: 'The type of browser to run tests through.',
      format: ['chrome', 'firefox'],
      default: 'chrome'
    },
    reportFormat: {
      doc: 'The supported formats that reports may be written in.',
      format: ['html', 'json', 'md'],
      default: 'html'
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
      runJobRoute: '/run-job',
      testResultRoute: '/test-results'
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
      runJobRoute: '/run-job',
      testResultRoute: '/test-results'
    },
    tls: {
      name: 'tls',
      url: {
        doc: 'The url of the  tls-checker microservice.',
        format: 'url',
        default: 'https://127.0.0.1:1000'
      },
      active: {
        doc: 'Whether or not the tls-checker microservice is active.',
        format: 'Boolean',
        default: true
      },
      testPlanRoute: '/test-plan',
      runJobRoute: '/run-job',
      testResultRoute: '/test-results'
    }
  },
  buildUserConfig: {
    version: {
      doc: 'The version of the build user config accepted by this API.',
      format: ['0.1.0-alpha.1'],
      default: '0.1.0-alpha.1'
    }
  }
};

const config = convict(schema);
config.loadFile(path.join(__dirname, `config.${config.get('env')}.json`));
config.validate();

module.exports = config;
