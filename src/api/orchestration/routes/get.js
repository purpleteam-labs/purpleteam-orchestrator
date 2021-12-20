// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

const Boom = require('@hapi/boom'); // eslint-disable-line
const { validateTesterNameSessionId } = require('src/api/orchestration/schemas/testers');
const config = require('config/config');

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
      const channel = `${testerName}${sessionId ? `-${sessionId}` : ''}`; // We get 'NA' sent from the CLI for Tls and Server
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
      const { server: { app: { model } } } = request;
      return respToolkit.file(model.getOutcomesArchiveFilePath(), { confine: false });
    }
  }
}, {
  method: 'GET',
  path: '/status',
  handler: (request) => {
    const { server: { app: { model } } } = request;
    return model.status();
  }
}, {
  // Only to be invoked when Testers are finished.
  method: 'GET',
  path: '/reset',
  handler: async (request) => {
    const { server: { app: { model } } } = request;
    await model.resetTesters({ level: 'hard' });
    return `Reset initiated. Please wait at least ${config.get('coolDown.timeout') / 1000} seconds before starting a Test Run.`;
  }
}];
