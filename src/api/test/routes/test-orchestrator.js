const Boom = require('boom');

module.exports = [{
  method: 'POST',
  path: '/test',
  handler: async (request, respToolkit) => { // eslint-disable-line no-unused-vars

    //throw Boom.badImplementation('Oh, dear, not sure what happened.', 'Some data to be used serverside from data property');

    






// First up work out design of creating jobs. What sort of architecture is commonly used for this in hapi.







// Create job for each tester
//    Each job contains collection of testSession

    const { model } = request.server.app;
    const testPlan = await model.deployTestTeam();





// Start each tester with their jobs (provide argument for planOnly)
//    If planOnly is passed, when the plan is returned, the tester is done
//    Always return the plan to the CLI

    return respToolkit.response().code(202);
    // If we return a body then it needs to meet the jsonapi spec and the media type (Content-Type) must be application/vnd.api+json


//    Provide feedback to the CLI on progress if requested

// Once all testers have returned their results (by way of SSE):
//    Coalate results / report(s) once all testers are done, generate report in build user specified formats and return them







  }

}, {
  // The CLI should (optionally) be able to query the progress at any given time.
  method: 'GET',
  path: '/test/progress',
  handler: (request, respToolkit) => { // eslint-disable-line no-unused-vars
    return 'cats';
  }

}];


