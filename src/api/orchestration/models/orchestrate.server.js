const log = require('purpleteam-logger').logger();
const { Orchestration: { TesterUnavailable, TestPlanUnavailable } } = require('src/strings');


async function plan(testJob, testerConfig) {
  const { name, url, active, testPlanRoute } = testerConfig;

  if (!active) return TestPlanUnavailable(name);




};


async function attack(testJob, testerConfig) {
  const { name, url, active, runJobRoute, testResultRoute } = testerConfig;

  if (!active) return TesterUnavailable(name);




};

module.exports = {
  plan,
  attack
}