const log = require('purpleteam-logger').get(); // eslint-disable-line no-unused-vars
const { Orchestration: { TesterUnavailable, TestPlanUnavailable } } = require('src/strings');


const internals = {
  testerConfig: null,
  testSessions: []
};


const init = (testerConfig) => {
  if (!internals.testerConfig) internals.testerConfig = testerConfig;
};


const isActive = () => internals.testerConfig.active;


async function plan(testJob) { // eslint-disable-line no-unused-vars
  const { testerConfig: { name, url, testPlanRoute } } = internals; // eslint-disable-line no-unused-vars

  if (!isActive()) return { name, message: TestPlanUnavailable(name) };

  throw new Error('Function "plan" of tls tester is not implemented!');
}


async function attack(testJob) { // eslint-disable-line no-unused-vars
  const { testerConfig: { name, url, runJobRoute, testResultRoute } } = internals; // eslint-disable-line no-unused-vars

  if (!isActive()) return { name, message: TesterUnavailable(name) };

  throw new Error('Function "attack" of tls tester is not implemented!');
}


const setTestSessionFinished = (testSessionId) => { // eslint-disable-line no-unused-vars
  throw new Error('Function "setTestSessionFinished" of tls tester is not implemented!');
};


const areAllTestSessionsFinished = () => { throw new Error('Function "areAllTestSessionsFinished" of tls tester is not implemented!'); };


module.exports = {
  init,
  isActive,
  plan,
  attack,
  setTestSessionFinished,
  areAllTestSessionsFinished
};
