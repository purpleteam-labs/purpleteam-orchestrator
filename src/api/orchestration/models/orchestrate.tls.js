const { Orchestration: { TestPlanUnavailable } } = require('../../../strings');

async function attack(testJob, testerConfig) {
  const { name, url, active, runJobRoute, testResultRoute } = testerConfig;

  if (!active) return TestPlanUnavailable(name);




};

module.exports = {
  attack
}