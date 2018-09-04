const log = require('purpleteam-logger').get();
const EventSource = require('eventsource');
const Wreck = require('wreck');
const { Orchestration: { TesterUnavailable, TestPlanUnavailable } } = require('src/strings');


async function plan(testJob, testerConfig) {
  const { name, url, active, testPlanRoute } = testerConfig;

  if (!active) return TestPlanUnavailable(name);

  const promisedResponse = Wreck.post(`${url}${testPlanRoute}`, { headers: { 'content-type': 'application/vnd.api+json' }, payload: testJob });
  try {
    const { res, payload } = await promisedResponse; // eslint-disable-line no-unused-vars
    const testPlanPayload = payload.toString();

    log.notice(`\n${testPlanPayload}`, { tags: ['orchestrate.app'] });
    return { name, message: testPlanPayload };
  } catch (e) {
    const handle = {
      errorMessageFrame: innerMessage => `Error occured while attempting to retrieve your test plan. Error was: ${innerMessage}`,
      buildUserMessage: '"App tester is currently unreachable"',
      isBoom: () => e.output.payload,
      notBoom: () => e.message
    };
    log.alert(handle.errorMessageFrame(JSON.stringify(handle[e.isBoom ? 'isBoom' : 'notBoom']())), { tags: ['orchestrate.app'] });

    return { name, message: handle.errorMessageFrame(handle.buildUserMessage) };
  }
}


function subscribeToTesterProgress(testerName, url, testResultRoute) {
  // Todo: should probably be awaited.

  const eventSource = new EventSource(`${url}${testResultRoute}`);
  eventSource.addEventListener(`${testerName}TestingResult`, (event) => {
    // const dataFormat = Object.prototype.hasOwnProperty.call(event, 'dataFormat') ? event.dataFormat : null;
    // console.log(dataFormat === 'json' ? JSON.parse(event.data) : event.data);
    log.notice(JSON.parse(event.data).testingResult, { tags: ['orchestrate.app'] });
  });
}


async function attack(testJob, testerConfig) {
  const { name, url, active, runJobRoute, testResultRoute } = testerConfig;

  if (!active) return { name, message: TesterUnavailable(name) };


  const { res, payload } = await Wreck.post(`${url}${runJobRoute}`, { headers: { 'content-type': 'application/vnd.api+json' }, payload: testJob }); // eslint-disable-line no-unused-vars
  const runJobPayload = payload.toString();
  log.notice(runJobPayload, { tags: ['orchestrate.app'] });

  if (!runJobPayload.startsWith('Request ignored')) subscribeToTesterProgress(name, url, testResultRoute);

  return { name, message: runJobPayload };
}


module.exports = {
  plan,
  attack
};
