//const log = require('purpleteam-logger').logger();
const Boom = require('boom');
const { Orchestration: { BuildUserConfigMaskPassword } } = require('src/strings');
const buildUserConfigSchema = require('src/api/orchestration/schemas/buildUserConfig');
const Joi = require('joi');

const internals = {
  validate: {
    failAction: async (request, respToolkit, err) => {
      request.log(['error', 'post'], `An error occured while validating a build user's config. The following are the details:\nbuild user payload: ${BuildUserConfigMaskPassword(request.payload)}\nname: ${err.name}\nmessage: ${err.message}\noutput: ${JSON.stringify(err.output, null, '  ')} `);

      // https://github.com/hapijs/boom#faq
      // https://github.com/hapijs/hapi/blob/master/API.md#error-transformation
      const error = Boom.badRequest(err.message);
      error.output.payload.name = err.name;
      throw error;
    },
    // Todo: Provide full validation. Test with passing an empty payload too.
    payload: buildUserConfigSchema
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

      //throw Boom.badImplementation('Oh, dear, not sure what happened.', 'Some data to be used serverside from data property');

    










      const { model } = request.server.app;
      const runJob = await model.testTeamAttack(request.payload);





  // Start each tester with their jobs (provide argument for planOnly)
  //    If planOnly is passed, when the plan is returned, the tester is done
  //    Always return the plan to the CLI

      return respToolkit.response(runJob).code(202);
      // If we return JSON API data then it needs to meet the jsonapi spec (http://jsonapi.org/format/#content-negotiation-servers) and the media type (Content-Type) must be application/vnd.api+json


  //    Provide feedback to the CLI on progress if requested

  // Once all testers have returned their results (by way of SSE):
  //    Coalate results / report(s) once all testers are done, generate report in build user specified formats and return them







    }
  }
}];
