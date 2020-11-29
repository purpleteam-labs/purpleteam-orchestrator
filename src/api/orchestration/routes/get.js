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
  path: '/tester-progress/{testerName}/{sessionId}',
  options: {
    validate: internals.validate,
    handler: (request, respToolkit) => { // eslint-disable-line no-unused-vars
      const { server: { app: { model } }, params: { testerName, sessionId } } = request;
      const channel = `${testerName}${sessionId ? `-${sessionId}` : ''}`;
      const event = 'testerProgress';
      const response = model.initSSE(channel, event, respToolkit);
      return response;
    }
  }
}, {
  method: 'GET',
  path: '/poll-tester-progress/{testerName}/{sessionId}',
  options: {
    validate: internals.validate,
    handler: (request, respToolkit) => { // eslint-disable-line no-unused-vars
      // const { server: { app: { model } }, params: { testerName, sessionId } } = request;
      // const channel = `${testerName}${sessionId ? `-${sessionId}` : ''}`;
      const event = 'testerProgress';
      return respToolkit.response({ id: Date.now(), event, data: { progress: 'hi there.....' } });
    }
  }
}, {
  method: 'GET',
  path: '/outcomes',
  options: {
    handler: (request, respToolkit) => {
      const { model: { getOutcomesArchiveFilePath } } = request.server.app;
      return respToolkit.file(getOutcomesArchiveFilePath(), { confine: false });
    }
  }
}, {
  method: 'GET',
  path: '/status',
  handler: () => 'orchestrator is up'
}];
