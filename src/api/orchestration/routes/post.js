// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of PurpleTeam.

// PurpleTeam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// PurpleTeam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with PurpleTeam. If not, see <https://www.gnu.org/licenses/>.

const Boom = require('@hapi/boom'); // eslint-disable-line import/no-extraneous-dependencies
const { Orchestration: { JobMaskPassword } } = require('src/strings');
const config = require('config/config');

const sutConfig = config.getSchema()._cvtProperties.sut; // eslint-disable-line no-underscore-dangle
const jobSchemaOpts = {
  loggerConfig: config.get('logger'),
  sutConfig: {
    browserOptions: sutConfig._cvtProperties.browser.format, // eslint-disable-line no-underscore-dangle
    defaultBrowser: sutConfig._cvtProperties.browser.default // eslint-disable-line no-underscore-dangle
  },
  jobConfig: config.get('job')
};

const { validateJob } = require('src/api/orchestration/schemas/job').init(jobSchemaOpts);

const internals = {
  validate: {
    failAction: async (request, respToolkit, err) => {
      request.log(['error', 'post'], `An error occurred while validating the Job. The following are the details:\nunmodified Job Payload: ${JobMaskPassword(request.payload)}\nname: ${err.name}\nmessage. Errors: ${err.message}\noutput: ${JSON.stringify(err.output, null, 2)} `);

      // https://github.com/hapijs/boom#faq
      // https://github.com/hapijs/hapi/blob/master/API.md#error-transformation
      const error = Boom.badRequest(err.message);
      error.output.payload.name = err.name;
      throw error;
    },
    // Todo: Provide full validation. Test with passing an empty payload too.
    payload: validateJob
  }
};


module.exports = [{
  method: 'POST',
  path: '/testplan',
  options: {
    validate: internals.validate,
    handler: async (request, respToolkit) => {
      const { model } = request.server.app;
      const testPlan = await model.testTeamPlan(request.payload);

      return respToolkit.response(testPlan).code(200);
    }
  }
}, {
  method: 'POST',
  path: '/test',
  options: {
    validate: internals.validate,
    handler: async (request, respToolkit) => { // eslint-disable-line no-unused-vars
      // throw Boom.badImplementation('Oh, dear, not sure what happened.', 'Some data to be used serverside from data property');

      const { model } = request.server.app;
      let runJob;
      try {
        runJob = await model.testTeamAttack(request.payload);
      } catch (e) {
        // Errors with statusCode 500 have their messages hidden from the end user: https://hapi.dev/module/boom/api/?v=9.1.0#http-5xx-errors
        throw Boom.boomify(e, { statusCode: e.statusCode || 500 });
      }

      return respToolkit.response(runJob).code(202);
      // If we return JSON API data then it needs to meet the jsonapi spec (http://jsonapi.org/format/#content-negotiation-servers) and the media type (Content-Type) must be application/vnd.api+json
    }
  }
}];
