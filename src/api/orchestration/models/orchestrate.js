const { exec } = require('child_process');
const fs = require('fs');
const { promisify } = require('util');
const Bourne = require('@hapi/bourne');

const { Orchestration: { BuildUserConfigMaskPassword } } = require('src/strings');

let testerModels;
let outcomesConfig;
let log;

const initialiseModels = async (testersConfig) => {
  await (async () => {
    const promiseToReadDir = promisify(fs.readdir);
    const modelNameParts = { domain: 0, testerType: 1, fileExtension: 2 };
    const modelFileNames = await promiseToReadDir(__dirname);
    const subModelFileNames = modelFileNames.filter((fileName) => fileName === 'index.js' ? false : !(fileName.startsWith('.js', 11))); // eslint-disable-line no-confusing-arrow
    testerModels = subModelFileNames.map(fileName => ({ ...require(`./${fileName}`), name: fileName.split('.')[modelNameParts.testerType] })); // eslint-disable-line
  })();

  testerModels.forEach((testerModel) => testerModel.init(testersConfig[testerModel.name]));
};

const archiveOutcomes = () => {
  // For a lib based and richer solution: https://github.com/archiverjs/node-archiver
  const { compressionLvl, fileName, dir } = outcomesConfig;
  log.debug(`About to write outcomes file "${fileName}" to dir "${dir}"`, { tags: ['orchestrate'] });
  exec(`zip ${compressionLvl} ${fileName} *`, { cwd: dir }, (error, stdout, stderr) => {
    if (error) {
      log.error(`Error occurred archiving the outcomes: ${error}.`, { tags: ['orchestrate'] });
      return;
    }

    !!stdout && log.notice(`Archiving the outcomes, stdout:\n${stdout}`, { tags: ['orchestrate'] });
    !!stderr && log.notice(`Archiving the outcomes, stderr:\n${stderr}`, { tags: ['orchestrate'] });
  });
};

const setTargetModelTestSessionFinished = (chan, models) => {
  const channelParts = chan.split('-', 2);
  const targetModelName = channelParts[0];
  const targetTestSessionId = channelParts[1];
  const targetModel = models.find((model) => model.name === targetModelName);
  if (!targetModel) throw new Error(`Could not find the correct model to update, the channel used was ${chan}.`);
  targetModel.setTestSessionFinished(targetTestSessionId);
};

const areAllTestSessionsOfAllTestersFinishedOrNonexistent = (models) => models.filter((m) => m.isActive()).every((m) => m.areAllTestSessionsFinishedOrNoneExist());

const processTesterFeedbackMessageForCli = ({ update, chan, models, cleanUpTesterWatcherAfterTestRun }) => {
  let allTestSessionsOfAllTestersFinished;
  let customMessageForCli;
  if (update.event === 'testerProgress' && update.data.progress?.startsWith('Tester finished:')) {
    setTargetModelTestSessionFinished(chan, models);
    allTestSessionsOfAllTestersFinished = areAllTestSessionsOfAllTestersFinishedOrNonexistent(models);
    customMessageForCli = allTestSessionsOfAllTestersFinished && 'All test sessions of all testers are finished.';
  }
  let dataMap;
  if (customMessageForCli) {
    dataMap = { progress: customMessageForCli };
  } else {
    dataMap = update.data;
  }
  if (allTestSessionsOfAllTestersFinished) {
    archiveOutcomes();
    cleanUpTesterWatcherAfterTestRun();
  }
  return { dataMap, allTestSessionsOfAllTestersFinished };
};

const sseTesterWatcherCallback = (chan, message, respToolkit, models, cleanUpTesterWatcherAfterTestRun) => {
  const response = respToolkit.response(message);
  const update = Bourne.parse(response.source);
  const { dataMap, allTestSessionsOfAllTestersFinished } = processTesterFeedbackMessageForCli({ update, chan, models, cleanUpTesterWatcherAfterTestRun });
  respToolkit.event({ id: update.timestamp, event: update.event, data: dataMap });
  // Close event stream if all testers finished. null makes stream emit it's `end` event.
  allTestSessionsOfAllTestersFinished && setTimeout(() => { respToolkit.event(null); }, 10000);
  // Now we just close from client side, so client doesn't keep trying to re-establish.
};

const lpTesterWatcherCallback = (chan, message, models, cleanUpTesterWatcherAfterTestRun) => {
  // We use event 'testerMessage' when the Redis client returns a nil multi-bulk (The event type is arbitrary if there was no message) and 'testerMessage' is the easiest to handle in the CLI.
  //   This is what happens when we blpop (blocking lpop) and it times out waiting for a message to be available on the given list.
  //   So there is actually no message published from any tester.
  const nonNullMessage = (message) || { id: Date.now(), event: 'testerProgress', data: { progress: null } };
  const update = typeof nonNullMessage === 'string' ? Bourne.parse(nonNullMessage) : nonNullMessage;
  const { dataMap } = processTesterFeedbackMessageForCli({ update, chan, models, cleanUpTesterWatcherAfterTestRun });
  update.data = dataMap;
  return update;
};

const clearOutcomesDir = async () => {
  const promiseToReadDir = promisify(fs.readdir);
  const promiseToUnlink = promisify(fs.unlink);
  // const promiseToChmod = promisify(fs.chmod);
  const { dir } = outcomesConfig;

  try {
    const fileNames = await promiseToReadDir(dir);
    if (fileNames.length) {
      // const chmodPromises = fileNames.map(async (name) => promiseToChmod(name, Oo300));
      // await Promise.all(chmodPromises);
      const unlinkPromises = fileNames.map(async (name) => promiseToUnlink(`${dir}${name}`));
      await Promise.all(unlinkPromises);
    }
  } catch (e) { // This may fail if the group permissions on the outcomes dir does not have wx.
    const errorMessage = 'Clearing the outcomes directory failed.';
    log.error(`${errorMessage} The error was: ${e}.`, { tags: ['orchestrate'] });
    const error = new Error(errorMessage);
    // Errors with statusCode 500 have their messages hidden from the end user: https://hapi.dev/module/boom/api/?v=9.1.0#http-5xx-errors
    //   So if you want the user to see something at all useful, don't use 500.
    error.statusCode = 512;
    throw error;
  }
};

class Orchestrate {
  constructor(options) {
    const { log: logger, testers, testerWatcher, outcomes } = options;

    this.log = logger;
    this.testersConfig = testers;
    this.testerWatcher = testerWatcher;
    log = logger;
    outcomesConfig = outcomes;
    initialiseModels(this.testersConfig);
  }

  // eslint-disable-next-line class-methods-use-this
  getOutcomesArchiveFilePath() {
    const { dir, fileName } = outcomesConfig;
    return `${dir}${fileName}`;
  }

  async testTeamAction(testJob, action) {
    this.log.notice(`The buildUserConfig used to "${action}" with, after validation and any modifications, was:\n${BuildUserConfigMaskPassword(testJob)}\n\n`, { tags: ['orchestrate'] });
    const combinedTestActionResult = testerModels.map((testerModel) => testerModel[action](testJob));
    return Promise.all(combinedTestActionResult);
  }

  async testTeamPlan(testJob) {
    return this.testTeamAction(testJob, 'plan');
  }

  async testTeamAttack(testJob) {
    if (areAllTestSessionsOfAllTestersFinishedOrNonexistent(testerModels)) await clearOutcomesDir();
    const teamResponses = await this.testTeamAction(testJob, 'attack'); // Sets isFinished to false.
    return teamResponses;
  }

  initSSE(channel, event, respToolkit) {
    const { testerWatcher: { cleanUpAfterTestRun: cleanUpTesterWatcherAfterTestRun } } = this;
    const testerWatcherCallbackClosure = (chan, message) => {
      sseTesterWatcherCallback(chan, message, respToolkit, testerModels, cleanUpTesterWatcherAfterTestRun);
    };
    if (!this.testerWatcher.subscribe) {
      const errorMessage = 'The purpleteam API is configured to use Long Polling. Make sure you have the CLI configured to use "lp".';
      log.error(errorMessage, { tags: ['orchestrate'] });
      const error = new Error(errorMessage);
      error.statusCode = 421;
      throw error;
    }
    this.testerWatcher.subscribe(channel, testerWatcherCallbackClosure);
    const initialEvent = { id: Date.now(), event, data: { progress: `Initialising SSE subscription to "${channel}" channel for the event "${event}".` } };
    const initialResponse = respToolkit.event(initialEvent);
    return initialResponse;
    // To cancel the event stream:
    //    https://github.com/mtharrison/susie#how-do-i-finish-a-sse-stream-for-good
    //    https://www.html5rocks.com/en/tutorials/eventsource/basics/#toc-canceling
  }

  async pollTesterMessages(channel) {
    const { testerWatcher: { cleanUpAfterTestRun: cleanUpTesterWatcherAfterTestRun } } = this;
    // We'll probably need to get testerWatcherCallbackClosure put somewhere else as this function is hot.
    const testerWatcherCallbackClosure = (chan, message) => lpTesterWatcherCallback(chan, message, testerModels, cleanUpTesterWatcherAfterTestRun);
    if (!this.testerWatcher.pollTesterMessages) {
      const errorMessage = 'The purpleteam API is configured to use Server Sent Events. Please adjust the CLI configuration to use "sse".';
      log.error(errorMessage, { tags: ['orchestrate'] });
      const error = new Error(errorMessage);
      error.statusCode = 421;
      throw error;
    }
    const testerMessageSet = await this.testerWatcher.pollTesterMessages(channel, testerWatcherCallbackClosure);
    return testerMessageSet;
  }
}

module.exports = Orchestrate;
