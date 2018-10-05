const log = require('purpleteam-logger').get();
const Wreck = require('wreck');
const { Orchestration: { TesterUnavailable, TestPlanUnavailable } } = require('src/strings');

const internals = {
  testerConfig: null,
  testSessions: []
};


const init = (testerConfig) => {
  if (!internals.testerConfig) internals.testerConfig = testerConfig;
};


const isActive = () => internals.testerConfig.active;


async function plan(testJob) {
  const { testerConfig: { name, url, testPlanRoute } } = internals;

  if (!isActive()) return TestPlanUnavailable(name);

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


async function attack(testJob) {
  const { testerConfig: { name, url, runJobRoute } } = internals;

  if (!isActive()) return { name, message: TesterUnavailable(name) };

  const hydratedTestJob = JSON.parse(testJob);
  internals.testSessions = hydratedTestJob.included.filter(resourceObj => resourceObj.type === 'testSession').map(testSessionResourceObj => ({ id: testSessionResourceObj.id, isFinished: false }));

  const { res, payload } = await Wreck.post(`${url}${runJobRoute}`, { headers: { 'content-type': 'application/vnd.api+json' }, payload: testJob }); // eslint-disable-line no-unused-vars
  const runJobPayload = payload.toString();
  log.notice(runJobPayload, { tags: ['orchestrate.app'] });

  return { name, message: runJobPayload };
}


const setTestSessionFinished = (testSessionId) => {
  const { testSessions } = internals;

  if (!testSessionId) throw new Error('There was no testSessionId supplied to the testSessions method of the app model');
  if (typeof testSessionId !== 'string') throw new Error('"testSessionId" must be a string');

  testSessions.find(tS => tS.id === testSessionId).isFinished = true;
};


const areAllTestSessionsFinished = () => internals.testSessions.every(tS => tS.isFinished);


module.exports = {
  init,
  isActive,
  plan,
  attack,
  setTestSessionFinished,
  areAllTestSessionsFinished
};
