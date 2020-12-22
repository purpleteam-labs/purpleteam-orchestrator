const Boom = require('@hapi/boom'); // eslint-disable-line
const { validateTesterNameSessionId } = require('src/api/orchestration/schemas/testers');

const internals = {
  validateTesterFeedback: {
    failAction: async (request, respToolkit, err) => {
      const errorMessage = `An error occurred while validating the testerName and SessionId parameters supplied to route "${request.path}", the following are the details: ${err.message}`;
      request.log(['error', 'get'], errorMessage);

      // https://github.com/hapijs/boom#faq
      // https://github.com/hapijs/hapi/blob/master/API.md#error-transformation
      const error = Boom.badRequest(`${errorMessage}`);
      error.output.payload.name = err.name;
      throw error;
    },
    params: validateTesterNameSessionId
  }
};

module.exports = [{
  method: 'GET',
  path: '/tester-feedback/{testerName}/{sessionId}',
  options: {
    validate: internals.validateTesterFeedback,
    handler: (request, respToolkit) => { // eslint-disable-line no-unused-vars
      const { server: { app: { model } }, params: { testerName, sessionId } } = request;
      const channel = `${testerName}${sessionId ? `-${sessionId}` : ''}`;
      const event = 'testerProgress';

      let response;
      try {
        response = model.initSSE(channel, event, respToolkit);
      } catch (e) {
        // Errors with statusCode 500 have their messages hidden from the end user: https://hapi.dev/module/boom/api/?v=9.1.0#http-5xx-errors
        throw Boom.boomify(e, { statusCode: e.statusCode || 500 });
      }
      return response;
    }
  }
}, {
  method: 'GET',
  path: '/poll-tester-feedback/{testerName}/{sessionId}',
  options: {
    validate: internals.validateTesterFeedback,
    handler: async (request, respToolkit) => { // eslint-disable-line no-unused-vars
      const { server: { app: { model } }, params: { testerName, sessionId } } = request;
      const channel = `${testerName}${sessionId ? `-${sessionId}` : ''}`;

      let testerMessageSet;
      try {
        testerMessageSet = await model.pollTesterMessages(channel);
      } catch (e) {
        // Errors with statusCode 500 have their messages hidden from the end user: https://hapi.dev/module/boom/api/?v=9.1.0#http-5xx-errors
        throw Boom.boomify(e, { statusCode: e.statusCode || 500 });
      }
      return testerMessageSet;
      // Or try respToolkit.response(testerMessageSet). https://hapi.dev/api/?v=20.0.3#-hresponsevalue
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
