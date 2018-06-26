const log = require('purpleteam-logger').logger();
const EventSource = require('eventsource');
const Wreck = require('wreck');
const { Orchestration: { TesterUnavailable, TestPlanUnavailable } } = require('src/strings');


async function deployAppScanner(config) {

};

async function plan(testJob, testerConfig) {

  const { name, url, active, testPlanRoute } = testerConfig;

  if (!active) return TestPlanUnavailable(name);

  const { res, payload } = await Wreck.post(`${url}${testPlanRoute}`, {headers: {'content-type': 'application/vnd.api+json'}, payload: testJob});
  const testPlanPayload = payload.toString();
  log.notice(testPlanPayload, {tags: ['orchestrate.app']});

  return testPlanPayload;
};






async function attack(testJob, testerConfig) {
  const { name, url, active, runJobRoute, testResultRoute } = testerConfig;

  if (!active) return TesterUnavailable(name);

  const { res, payload } = await Wreck.post(`${url}${runJobRoute}`, {headers: {'content-type': 'application/vnd.api+json'}, payload: testJob});
  const runJobPayload = payload.toString();
  log.notice(runJobPayload, {tags: ['orchestrate.app']});

  subscribeToTesterProgress(name, url, testResultRoute);

  return runJobPayload;
};


function subscribeToTesterProgress(testerName, url, testResultRoute) {


  // Todo: should probably be awaited.

  let eventSource = new EventSource(`${url}${testResultRoute}`);
  eventSource.addEventListener(`${testerName}TestingResult`, (event) => {      
    //const dataFormat = Object.prototype.hasOwnProperty.call(event, 'dataFormat') ? event.dataFormat : null;
    //console.log(dataFormat === 'json' ? JSON.parse(event.data) : event.data);
    log.notice(JSON.parse(event.data).testingResult, {tags: ['orchestrate.app']});
  });




}


module.exports = {
  plan,
  attack
}