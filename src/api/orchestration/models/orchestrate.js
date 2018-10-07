const fs = require('fs');
const { promisify } = require('util');

const { Orchestration: { BuildUserConfigMaskPassword } } = require('src/strings');

let testerModels;
let outcomesDirectory;

(async () => {
  const promiseToReadDir = promisify(fs.readdir);
  const modelNameParts = { domain: 0, testerType: 1, fileExtension: 2 };
  const modelFileNames = await promiseToReadDir(__dirname);
  const subModelFileNames = modelFileNames.filter(fileName => fileName === 'index.js' ? false : !(fileName.startsWith('.js', 11))); // eslint-disable-line no-confusing-arrow
  testerModels = subModelFileNames.map(fileName => ({ ...require(`./${fileName}`), name: fileName.split('.')[modelNameParts.testerType] })); // eslint-disable-line
})();


const areAllTestSessionsOfAllTestersFinished = (chan, models) => {
  const channelParts = chan.split('-', 2);
  const targetModelName = channelParts[0];
  const targetTestSessionId = channelParts[1];

  const targetModel = models.find(model => model.name === targetModelName);
  if (!targetModel) throw new Error(`Could not find the correct model to update, the channel used was ${chan}`);

  targetModel.setTestSessionFinished(targetTestSessionId);
  return models.filter(m => m.isActive()).every(m => m.areAllTestSessionsFinished());
};


const checkForCustomMessageForCli = (update, chan, models) => {
  let message;
  if (update.event === 'testerProgress' && update.data.progress.startsWith('Tester finished.')) {
    message = areAllTestSessionsOfAllTestersFinished(chan, models) ? 'All test sessions of all testers are finished' : undefined;
  }
  return message;
};


const testerWatcherCallback = (chan, message, respToolkit, models) => {
  const response = respToolkit.response(message);
  const update = JSON.parse(response.source);
  const customMessageForCli = checkForCustomMessageForCli(update, chan, models);
  respToolkit.event({ id: update.timestamp, event: update.event, data: customMessageForCli ? { progress: customMessageForCli } : update.data });
};


const clearOutcomesDir = async () => {
  const promiseToReadDir = promisify(fs.readdir);
  const promiseToUnlink = promisify(fs.unlink);

  try {
    const fileNames = await promiseToReadDir(outcomesDirectory);
    if (fileNames.length) {
      const unlinkPromises = fileNames.map(async name => promiseToUnlink(`${outcomesDirectory}${name}`));
      return await Promise.all(unlinkPromises);
    }
  } catch (e) {
    return e;
  }
  return undefined;
};


const archiveOutcomeFiles = () => {

};


class Orchestrate {
  constructor(options) {
    const { log, testers, testerWatcher, outcomesDir } = options;

    this.log = log;
    this.testersConfig = testers;
    this.testerWatcher = testerWatcher;
    outcomesDirectory = outcomesDir;
  }


  async testTeamAction(testJob, action) {
    this.log.notice(`The buildUserConfig used to "${action}" with, after validation and any modifications, was:\n${BuildUserConfigMaskPassword(testJob)}\n\n`, { tags: ['orchestrate'] });

    testerModels.forEach(testerModel => testerModel.init(this.testersConfig[testerModel.name]));
    const combinedTestActionResult = testerModels.map(testerModel => testerModel[action](testJob));

    return Promise.all(combinedTestActionResult);
  }


  async testTeamPlan(testJob) {
    return this.testTeamAction(testJob, 'plan');
  }


  async testTeamAttack(testJob) {
    const error = await clearOutcomesDir();
    if (error) {
      this.log.error(`Clearing the outcomes directory failed. The error was: ${error}`, { tags: ['orchestrate'] });
      throw error;
    }
    return this.testTeamAction(testJob, 'attack');
  }


  initSSE(channel, event, respToolkit) {
    const testerWatcherCallbackClosure = (chan, message) => {
      testerWatcherCallback(chan, message, respToolkit, testerModels);
    };
    this.testerWatcher.subscribe(channel, testerWatcherCallbackClosure);
    const initialEvent = { id: Date.now(), event, data: { progress: `Initialising subscription to "${channel}" channel for the event "${event}"` } };
    const initialResponse = respToolkit.event(initialEvent);
    return initialResponse;
    // To cancel the event stream:
    //    https://github.com/mtharrison/susie#how-do-i-finish-a-sse-stream-for-good
    //    https://www.html5rocks.com/en/tutorials/eventsource/basics/#toc-canceling
  }
}

module.exports = Orchestrate;
