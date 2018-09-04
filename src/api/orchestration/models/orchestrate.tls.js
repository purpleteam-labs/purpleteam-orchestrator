const log = require('purpleteam-logger').get(); // eslint-disable-line no-unused-vars
const { Orchestration: { TesterUnavailable, TestPlanUnavailable } } = require('src/strings');


async function plan(testJob, testerConfig) { // eslint-disable-line consistent-return
  const { name, url, active, testPlanRoute } = testerConfig; // eslint-disable-line no-unused-vars

  if (!active) return { name, message: TestPlanUnavailable(name) };
}


async function attack(testJob, testerConfig) { // eslint-disable-line consistent-return
  const { name, url, active, runJobRoute, testResultRoute } = testerConfig; // eslint-disable-line no-unused-vars

  if (!active) return { name, message: TesterUnavailable(name) };
}

module.exports = {
  plan,
  attack
};
