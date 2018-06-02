const convict = require('convict');
const path = require('path');

const schema = {
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
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
  testers: {    
    app: {
      name: 'app',
      url: {
        doc: 'The url of the  app-scanner microservice.',
        format: 'url',
        default: null
      },
      active: {
        doc: 'Whether or not the app-scanner microservice is active.',
        format: 'Boolean',
        default: true
      },
      runJobRoute: '/run-job',
      testResultRoute: '/test-results'
    },
    server: {
      name: 'server',
      url: {
        doc: 'The url of the  server-scanner microservice.',
        format: 'url',
        default: null
      },
      active: {
        doc: 'Whether or not the server-scanner microservice is active.',
        format: 'Boolean',
        default: true
      },
      runJobRoute: '/run-job',
      testResultRoute: '/test-results'      
    },
    tls: {
      name: 'tls',
      url: {
        doc: 'The url of the  tls-checker microservice.',
        format: 'url',
        default: null
      },
      active: {
        doc: 'Whether or not the tls-checker microservice is active.',
        format: 'Boolean',
        default: true
      },
      runJobRoute: '/run-job',
      testResultRoute: '/test-results'
    }
  }
};

const config = convict(schema);
config.loadFile(path.join(__dirname, `config.${config.get('env')}.json`));
config.validate();
console.log('(*) Local config file loaded');

module.exports = config;
