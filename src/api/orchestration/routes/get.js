const Boom = require('boom');

module.exports = [{
  // The CLI should (optionally) be able to query the progress at any given time.
  method: 'GET',
  path: '/test/progress',
  handler: (request, respToolkit) => { // eslint-disable-line no-unused-vars
    return 'cats';
  }

}];


