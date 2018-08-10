const fs = require('fs');
const { promisify } = require('util');

const { Orchestration: { BuildUserConfigMaskPassword } } = require('src/strings');

let testerModels;

(async () => {
  const promiseToReadDir = promisify(fs.readdir);
  const modelNameParts = { domain: 0, testerType: 1, fileExtension: 2 };
  const modelFileNames = await promiseToReadDir(__dirname);
  const subModelFileNames = modelFileNames.filter(fileName => fileName === 'index.js' ? false : !(fileName.startsWith('.js', 11))); // eslint-disable-line no-confusing-arrow
  testerModels = subModelFileNames.map(fileName => ({ ...require(`./${fileName}`), name: fileName.split('.')[modelNameParts.testerType] })); // eslint-disable-line
})();


class Orchestrate {
  constructor(options) {
    const { log, testers, testerWatcher } = options;

    this.log = log;
    this.testersConfig = testers;
    this.testerWatcher = testerWatcher;
  }


  async testTeamAction(testJob, action) {
    this.log.notice(`The build user supplied payload to "${action}" with, was:\n${BuildUserConfigMaskPassword(testJob)}\n\n`, { tags: ['orchestrate'] });

    const combinedTestActionResult = testerModels.map(testerModel => testerModel[action](testJob, this.testersConfig[testerModel.name]));

    return Promise.all(combinedTestActionResult);
  }


  async testTeamPlan(testJob) {
    return this.testTeamAction(testJob, 'plan');
  }


  async testTeamAttack(testJob) {
    return this.testTeamAction(testJob, 'attack');
  }


  initSSE(channel, event, respToolkit) {
    this.testerWatcher.subscribe(channel, (chan, message) => {
      const response = respToolkit.response(message);
      const update = JSON.parse(response.source);

      respToolkit.event({ id: update.timestamp, event: update.event, data: update.data });
    });
    const initialEvent = { id: Date.now(), event, data: { progress: `Initialising subscription to "${channel}" channel for the event "${event}"` } };
    const initialResponse = respToolkit.event(initialEvent);
    return initialResponse;
    // To cancel the event stream:
    //    https://github.com/mtharrison/susie#how-do-i-finish-a-sse-stream-for-good
    //    https://www.html5rocks.com/en/tutorials/eventsource/basics/#toc-canceling
  }
}

module.exports = Orchestrate;
