// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of PurpleTeam.

// PurpleTeam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// PurpleTeam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with PurpleTeam. If not, see <https://www.gnu.org/licenses/>.

const { exec } = require('child_process');
const { promises: fsPromises } = require('fs');

const Bourne = require('@hapi/bourne');

const { Orchestration: { JobMaskPassword } } = require('src/strings');

let testerModels;
let outcomesConfig;
let log;

const internals = {
  initTesterResponsesForCli: null,
  warmUpTestSessionMessageSets: []
};

const initialiseModels = async (testersConfig) => {
  await (async () => {
    const modelNameParts = { domain: 0, testerType: 1, fileExtension: 2 };
    const modelFileNames = await fsPromises.readdir(__dirname);
    const subModelFileNames = modelFileNames.filter((fileName) => fileName === 'index.js' ? false : !(fileName.startsWith('.js', 11))); // eslint-disable-line no-confusing-arrow
    testerModels = subModelFileNames.map(fileName => ({ ...require(`./${fileName}`), name: fileName.split('.')[modelNameParts.testerType] })); // eslint-disable-line
  })();

  testerModels.forEach((testerModel) => testerModel.init(testersConfig[testerModel.name]));
};

const archiveOutcomes = () => {
  // For a lib based and richer solution: https://github.com/archiverjs/node-archiver
  const { compressionLvl, fileName, dir } = outcomesConfig;
  log.info(`About to write outcomes file "${fileName}" to dir "${dir}"`, { tags: ['orchestrate'] });
  exec(`zip ${compressionLvl} ${fileName} *`, { cwd: dir }, (error, stdout, stderr) => {
    if (error) {
      log.error(`Error occurred archiving the outcomes: ${error}.`, { tags: ['orchestrate'] });
      return;
    }

    !!stdout && log.info(`Archiving the outcomes, stdout:\n${stdout}`, { tags: ['orchestrate'] });
    !!stderr && log.info(`Archiving the outcomes, stderr:\n${stderr}`, { tags: ['orchestrate'] });
  });
};

const setTargetModelTestSessionFinished = (chan, models) => {
  const channelParts = chan.split('-', 2);
  const targetModelName = channelParts[0];
  const targetTestSessionId = channelParts[1];
  const targetModel = models.find((model) => model.name === targetModelName);
  if (!targetModel) throw new Error(`Could not find the correct model to update, the channel used was ${chan}.`);
  // If we don't see this message in the log for every Test Session, then we've missed the message from a Tester
  // and the orchestrator is not in a state to take another Test Run.
  log.info(`Setting Test Session finished for ${targetModelName} model, testSessionId: "${targetTestSessionId}..."`, { tags: ['orchestrate'] });
  targetModel.setTestSessionFinished(targetTestSessionId);
};

const areAllTestSessionsOfAllTestersFinishedOrNonexistent = (models) => models.filter((m) => m.isActive()).every((m) => m.testerFinished());

const processTesterFeedbackMessageForCli = ({ update, chan, models, cleanUpTesterWatcherAfterTestRun }) => {
  let allTestSessionsOfAllTestersFinished;
  let customMessageForCli;
  if (update.event === 'testerProgress' && update.data.progress?.startsWith('Tester finished:')) { // CLI apiDecoratingAdapter depends on this string.
    setTargetModelTestSessionFinished(chan, models);
    allTestSessionsOfAllTestersFinished = areAllTestSessionsOfAllTestersFinishedOrNonexistent(models);
    customMessageForCli = allTestSessionsOfAllTestersFinished && 'All Test Sessions of all Testers are finished.'; // CLI apiDecoratingAdapter depends on this string.
  }
  let dataMap;
  if (customMessageForCli) {
    dataMap = { progress: customMessageForCli };
  } else {
    dataMap = update.data;
  }
  if (allTestSessionsOfAllTestersFinished) {
    internals.initTesterResponsesForCli = null; // Todo: This (side effect) is probably not the best place for this.
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
  // Close event stream if all Testers finished. null makes stream emit it's `end` event.
  allTestSessionsOfAllTestersFinished && setTimeout(() => { respToolkit.event(null); }, 10000);
  // Now we just close from client side, so client doesn't keep trying to re-establish.
};

const lpTesterWatcherCallback = (chan, message, models, cleanUpTesterWatcherAfterTestRun) => {
  // We use event 'testerMessage' when the Redis client returns a nil multi-bulk (The event type is arbitrary if there was no message) and 'testerMessage' is the easiest to handle in the CLI.
  //   This is what happens when we blpop (blocking lpop) and it times out waiting for a message to be available on the given list.
  //   So there is actually no message published from any Tester.
  const nonNullMessage = (message) || { id: Date.now(), event: 'testerProgress', data: { progress: null } };
  const update = typeof nonNullMessage === 'string' ? Bourne.parse(nonNullMessage) : nonNullMessage;
  const { dataMap } = processTesterFeedbackMessageForCli({ update, chan, models, cleanUpTesterWatcherAfterTestRun });
  update.data = dataMap;
  return update;
};

const clearOutcomesDir = async () => {
  // const promiseToChmod = promisify(fs.chmod);
  const { dir } = outcomesConfig;

  try {
    const fileNames = await fsPromises.readdir(dir);
    if (fileNames.length) {
      // const chmodPromises = fileNames.map(async (name) => promiseToChmod(name, Oo300));
      // await Promise.all(chmodPromises);
      const unlinkPromises = fileNames.map(async (name) => fsPromises.unlink(`${dir}${name}`));
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
    const { log: logger, testers, testerWatcher, outcomes, env } = options;

    this.log = logger;
    this.testersConfig = testers;
    this.testerWatcher = testerWatcher;
    this.env = env;
    log = logger;
    outcomesConfig = outcomes;
    initialiseModels(this.testersConfig);
  }

  // eslint-disable-next-line class-methods-use-this
  getOutcomesArchiveFilePath() {
    const { dir, fileName } = outcomesConfig;
    return `${dir}${fileName}`;
  }

  async testTeamPlan(testJob) {
    this.log.notice(`The Job used to "plan" with, after validation and any modifications, was:\n${JobMaskPassword(testJob)}\n\n`, { tags: ['orchestrate'] });
    const combinedTestPlanResult = testerModels.map((testerModel) => testerModel.plan(testJob));
    const teamPlanResponses = await Promise.all(combinedTestPlanResult);
    return teamPlanResponses;
  }

  // Subscribe to Test Sessions. If we don't, and one finishes before the subscriptions are set-up... due to the CLI retrying,
  // we never receive the vital "Tester finished:" message, so we never clean-up for the next Test Run.
  async #warmUpTestSessionMessageChannels() {
    internals.warmUpTestSessionMessageSets = [];
    const channelNames = testerModels.flatMap((tM) => tM.jobTestSessions().map((jTS) => `${tM.name}-${jTS.id}`));
    const emptyTesterMessageSets = channelNames.map((cN) => ({ channelName: cN, testerMessageSet: [] }));
    const warmUp = true;
    internals.warmUpTestSessionMessageSets = await Promise.all(emptyTesterMessageSets.map(async (tMS) => (
      { channelName: tMS.channelName, testerMessageSet: await this.pollTesterMessages(tMS.channelName, warmUp) }
    )));
  }

  async testTeamAttack(testJob) {
    if (areAllTestSessionsOfAllTestersFinishedOrNonexistent(testerModels)) await clearOutcomesDir();
    this.log.info(`The Job used to "attack" with, after validation and any modifications, was:\n${JobMaskPassword(testJob)}\n\n`, { tags: ['orchestrate'] });

    if (internals.initTesterResponsesForCli && internals.initTesterResponsesForCli.length) {
      return { testerStatuses: internals.initTesterResponsesForCli, testerFeedbackCommsMedium: this.testerWatcher.testerFeedbackCommsMedium };
    }
    if (internals.initTesterResponsesForCli) {
      this.log.debug('Causing a client-side timeout, to initiate retry.', { tags: ['orchestrate'] });
      /* Cause a timeout so client retries */ return (() => new Promise((resolve) => setTimeout(() => {
        this.log.debug('Finished waiting to cause client-side timeout.', { tags: ['orchestrate'] });
        resolve();
      }, /* Api Gateway timeout */ 30000)))();
    }

    internals.initTesterResponsesForCli = [];

    const combinedInitTesterPromises = testerModels.map((testerModel) => testerModel.initTester(testJob));
    const combinedInitTesterResponses = await Promise.all(combinedInitTesterPromises);

    combinedInitTesterResponses.forEach((iTR) => { this.log.info(`Tester name: ${iTR.name}, Tester message: ${iTR.message}`, { tags: ['orchestrate'] }); });

    const failedTesterInitialisations = combinedInitTesterResponses.filter((cV) => cV.message.startsWith('Tester failure:'));

    const startTesters = combinedInitTesterResponses.every((iTR) => {
      const isActive = testerModels.find((tM) => tM.name === iTR.name).isActive();
      const testerInitialised = iTR.message.startsWith('Tester initialised.');
      return (isActive && testerInitialised) || !isActive;
    });
    this.log.info(`${startTesters ? 'S' : 'Not s'}tarting ${startTesters ? 'all' : 'any'} active Testers.`, { tags: ['orchestrate'] });

    internals.initTesterResponsesForCli = failedTesterInitialisations.length || !startTesters
      ? combinedInitTesterResponses.map((iTR) => failedTesterInitialisations.length // eslint-disable-line no-confusing-arrow
        ? {
          name: iTR.name,
          message: `${iTR.message} ${failedTesterInitialisations.reduce((accum, cV) => `${accum ? `${accum}, ` : ''}${cV.name}`, '')} Tester(s) failed initialisation. Test Run aborted.`
        }
        : {
          name: iTR.name,
          message: iTR.message
        })
      : await (async () => {
        testerModels.forEach((tM) => tM.startTester());
        // The following means we don't rely on the CLI to subscribe to message channels, thus we should always get the "Tester finished:" message.
        this.env === 'cloud' && await this.#warmUpTestSessionMessageChannels();
        return combinedInitTesterResponses;
      })();

    return { testerStatuses: internals.initTesterResponsesForCli, testerFeedbackCommsMedium: this.testerWatcher.testerFeedbackCommsMedium };
  }

  initSSE(channel, event, respToolkit) {
    const { testerWatcher: { cleanUpAfterTestRun: cleanUpTesterWatcherAfterTestRun } } = this;
    const testerWatcherCallbackClosure = (chan, message) => {
      sseTesterWatcherCallback(chan, message, respToolkit, testerModels, cleanUpTesterWatcherAfterTestRun);
    };

    this.testerWatcher.subscribe(channel, testerWatcherCallbackClosure);
    const initialEvent = { id: Date.now(), event, data: { progress: `Initialising SSE subscription to "${channel}" channel for the event "${event}".` } };
    const initialResponse = respToolkit.event(initialEvent);
    return initialResponse;
    // To cancel the event stream:
    //    https://github.com/mtharrison/susie#how-do-i-finish-a-sse-stream-for-good
    //    https://www.html5rocks.com/en/tutorials/eventsource/basics/#toc-canceling
  }

  async #getTesterMessages(channel) {
    const { testerWatcher: { cleanUpAfterTestRun: cleanUpTesterWatcherAfterTestRun } } = this;
    const testerWatcherCallbackClosure = (chan, message) => lpTesterWatcherCallback(chan, message, testerModels, cleanUpTesterWatcherAfterTestRun);
    const testerMessageSet = await this.testerWatcher.pollTesterMessages(channel, testerWatcherCallbackClosure);
    return testerMessageSet;
  }

  async pollTesterMessages(channel, warmUp = false) {
    let testerMessageSet;
    if (!warmUp) {
      const index = internals.warmUpTestSessionMessageSets.findIndex((tSMS) => tSMS.channelName === channel);
      if (index > -1) {
        testerMessageSet = internals.warmUpTestSessionMessageSets.splice(index, 1)[0].testerMessageSet;
        return testerMessageSet;
      }
      testerMessageSet = await this.#getTesterMessages(channel);
      return testerMessageSet;
    }

    testerMessageSet = await this.#getTesterMessages(channel);
    return testerMessageSet;
  }
}

module.exports = Orchestrate;
