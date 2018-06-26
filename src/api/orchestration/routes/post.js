const Boom = require('boom');

module.exports = [{
  method: 'POST',
  path: '/testplan',
  handler: async (request, respToolkit) => {
    const { model } = request.server.app;
    const testPlan = await model.testTeamPlan(request.payload);

    return respToolkit.response(testPlan).code(200);
  }
}, {
  method: 'POST',
  path: '/test',
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

}];


