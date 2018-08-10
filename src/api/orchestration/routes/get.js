const Boom = require('boom'); // eslint-disable-line
const { testerNameSessionId } = require('src/api/orchestration/schemas/testers');

const internals = {
  validate: {
    failAction: async (request, respToolkit, err) => { // eslint-disable-line no-unused-vars
    },
    params: testerNameSessionId
  }
};

module.exports = [{
  method: 'GET',
  path: '/{testerName}-{sessionId}-tester-progress',
  options: {
    validate: internals.validate,
    handler: (request, respToolkit) => { // eslint-disable-line no-unused-vars
      const { model } = request.server.app;
      const { testerName, sessionId } = request.params;
      const channel = `${testerName}${sessionId ? `-${sessionId}` : ''}`;
      const event = 'testerProgress';
      const response = model.initSSE(channel, event, respToolkit);
      return response;
    }
  }


}];
