const convict = require('convict');
const path = require('path');

const schema = {
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NOE_ENV'
  },
  host: {
    port: {
      doc: 'The port of this host.',
      format: 'port',
      default: 2000,
      env: 'PORT'
    },
    iP: {
      doc: 'The IP address of this host.',
      format: 'ipaddress',
      default: '240.0.0.0'
    }
  },
  appScanner: {
    port: {
      doc: 'The port of the app-scanner microservice.',
      format: 'port',
      default: 3000,
      env: 'PORT'
    },
    iP: {
      doc: 'The IP address of the app-scanner microservice.',
      format: 'ipaddress',
      default: '240.0.0.0'
    }
  },
  serverScanner: {
    port: {
      doc: 'The port of the server-scanner microservice.',
      format: 'port',
      default: 3010,
      env: 'PORT'
    },
    iP: {
      doc: 'The IP address of the server-scanner microservice.',
      format: 'ipaddress',
      default: '240.0.0.0'
    }
  },
  tlsChecker: {
    port: {
      doc: 'The port of the tls-checker microservice.',
      format: 'port',
      default: 3020,
      env: 'PORT'
    },
    iP: {
      doc: 'The IP address of the tls-checker microservice.',
      format: 'ipaddress',
      default: '240.0.0.0'
    }
  },
};

const config = convict(schema);
config.loadFile(path.join(__dirname, `config.${config.get('env')}.json`));
config.validate();

module.exports = config;
