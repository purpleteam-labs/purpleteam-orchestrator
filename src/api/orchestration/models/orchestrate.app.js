const log = require('purpleteam-logger').logger();
const EventSource = require('eventsource');
const Wreck = require('wreck');
const { Orchestration: { TestPlanUnavailable } } = require('src/strings');


async function deployAppScanner(config) {

};

async function attack(testJob, testerConfig) {
  const { name, url, active, runJobRoute, testResultRoute } = testerConfig;
  const { data: { attributes: { progressUpdate, planOnly } } } = testJob;

  if (!active) return TestPlanUnavailable(name);
  





  const { res, payload } = await Wreck.post(`${url}${runJobRoute}`, {headers: {'content-type': 'application/vnd.api+json'}, payload: testJob});
  const testPlan = payload.toString();
  log.notice(testPlan, {tags: ['orchestrate.app']});

  if(progressUpdate && !planOnly) subscribeToTesterProgress(name, url, testResultRoute);

  return testPlan;


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
  attack
}