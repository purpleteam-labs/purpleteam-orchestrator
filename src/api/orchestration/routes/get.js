const Boom = require('boom');
const { testerNameSessionId } = require('src/api/orchestration/schemas/testers');

const internals = {
  validate: {
    failAction: async (request, respToolkit, err) => {
      debugger;
    },
    params: testerNameSessionId
  }
};

module.exports = [{
  // The CLI should (optionally) be able to query the progress at any given time.
  method: 'GET',
  path: '/{testerName}-{sessionId}-tester-progress',
  options: {
    validate: internals.validate,
    handler: (request, respToolkit) => { // eslint-disable-line no-unused-vars
      const { model } = request.server.app;
      const { testerName, sessionId } = request.params;
      const channel = `${testerName}${sessionId ? `-${sessionId}` : ''}`;
      const event = 'testerProgress';
      //const event = 'testerProgress'
      const response = model.initSSE(channel, event, respToolkit);
      debugger;
      return response;
    }
  }



}];


