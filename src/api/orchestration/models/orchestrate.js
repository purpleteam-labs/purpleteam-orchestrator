// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

const { exec } = require('child_process');
const { promises: fsPromises } = require('fs');

const Bourne = require('@hapi/bourne');

const { Orchestration: { JobMaskPassword } } = require('src/strings');

class Orchestrate {
  #log;
  #env;
  #testerModels;
  #outcomesConfig;
  #testersConfig;
  #testerWatcher;
  #initTesterResponsesForCli;
  #warmUpTestSessionMessageSets;
  #coolDownTimeout;

  constructor(options) {
    const { log, testers, testerWatcher, outcomes, env, coolDownTimeout } = options;

    this.#log = log;
    this.#testersConfig = testers;
    this.#testerWatcher = testerWatcher;
    this.#outcomesConfig = outcomes;
    this.#env = env;
    this.#coolDownTimeout = coolDownTimeout;
    this.#initialiseModels();
    this.#initTesterResponsesForCli = null;
    this.#warmUpTestSessionMessageSets = [];
  }

  async #initialiseModels() {
    await (async () => {
      const modelNameParts = { domain: 0, testerType: 1, fileExtension: 2 };
      const modelFileNames = await fsPromises.readdir(__dirname);
      const subModelFileNames = modelFileNames.filter((fileName) => fileName === 'index.js' ? false : !(fileName.startsWith('.js', 11))); // eslint-disable-line no-confusing-arrow
      this.#testerModels = subModelFileNames.map(fileName => ({ ...require(`./${fileName}`), name: fileName.split('.')[modelNameParts.testerType] })); // eslint-disable-line
    })();

    this.#testerModels.forEach((tM) => tM.init(this.#testersConfig[tM.name]));
  }

  #archiveOutcomes() {
    // For a lib based and richer solution: https://github.com/archiverjs/node-archiver
    const { compressionLvl, fileName, dir } = this.#outcomesConfig;
    this.#log.info(`About to write outcomes file "${fileName}" to dir "${dir}"`, { tags: ['orchestrate'] });
    exec(`zip ${compressionLvl} ${fileName} *`, { cwd: dir }, (error, stdout, stderr) => {
      if (error) {
        this.#log.error(`Error occurred archiving the outcomes: ${error}.`, { tags: ['orchestrate'] });
        return;
      }

      !!stdout && this.#log.info(`Archiving the outcomes, stdout:\n${stdout}`, { tags: ['orchestrate'] });
      !!stderr && this.#log.info(`Archiving the outcomes, stderr:\n${stderr}`, { tags: ['orchestrate'] });
    });
  }

  #setTargetModelTestSessionFinished(chan) {
    const channelParts = chan.split('-', 2);
    const targetModelName = channelParts[0];
    const targetTestSessionId = channelParts[1];
    const targetModel = this.#testerModels.find((tM) => tM.name === targetModelName);
    if (!targetModel) throw new Error(`Could not find the correct model to update, the channel used was ${chan}.`);
    // If we don't see this message in the log for every Test Session, then we've missed the message from a Tester
    // and the orchestrator is not in a state to take another Test Run.
    this.#log.info(`Setting Test Session finished for ${targetModelName} model, testSessionId: "${targetTestSessionId}..."`, { tags: ['orchestrate'] });
    targetModel.setTestSessionFinished(targetTestSessionId);
  }

  #areAllTestSessionsOfAllTestersFinishedOrNonexistent() { return this.#testerModels.filter((tM) => tM.isActive()).every((tM) => tM.testerFinished()); }

  #processTesterFeedbackMessageForCli({ update, chan }) {
    let allTestSessionsOfAllTestersFinished;
    let customMessageForCli;
    if (update.event === 'testerProgress' && update.data.progress?.startsWith('Tester finished:')) { // CLI apiDecoratingAdapter depends on this string.
      this.#setTargetModelTestSessionFinished(chan);
      allTestSessionsOfAllTestersFinished = this.#areAllTestSessionsOfAllTestersFinishedOrNonexistent();
      customMessageForCli = allTestSessionsOfAllTestersFinished && 'All Test Sessions of all Testers are finished.'; // CLI apiDecoratingAdapter depends on this string.
    }
    let dataMap;
    if (customMessageForCli) {
      dataMap = { progress: customMessageForCli };
    } else {
      dataMap = update.data;
    }
    return { dataMap, allTestSessionsOfAllTestersFinished };
  }

  status() {
    return !this.#initTesterResponsesForCli ? 'orchestrator is ready to take orders.' : 'Test Run is in progress.';
  }

  async resetTesters({ level = 'soft' }) {
    const { cleanUpAfterTestRun: cleanUpTesterWatcherAfterTestRun } = this.#testerWatcher;
    const reset = {
      soft: () => {},
      hard: async () => {
        await Promise.all(this.#testerModels.filter((tM) => tM.isActive()).map((tM) => tM.reset()));
      }
    };
    cleanUpTesterWatcherAfterTestRun();
    await reset[level]();
    // Think of the following as the gate keeper, Test Runs can not be initialised until this has run.
    setTimeout(() => {
      // Wait until this.#initTesterResponsesForCli has been sent back to the CLI before resetting it.
      this.#initTesterResponsesForCli = null;
      this.#log.info('orchestrator is ready to take orders.', { tags: ['orchestrate'] });
    }, this.#coolDownTimeout);
  }

  #sseTesterWatcherCallback(chan, message, respToolkit) {
    const response = respToolkit.response(message);
    const update = Bourne.parse(response.source);
    const { dataMap, allTestSessionsOfAllTestersFinished } = this.#processTesterFeedbackMessageForCli({ update, chan });
    if (allTestSessionsOfAllTestersFinished) {
      this.resetTesters({});
      this.#archiveOutcomes();
    }
    respToolkit.event({ id: update.timestamp, event: update.event, data: dataMap });
    // Close event stream if all Testers finished. null makes stream emit it's `end` event.
    allTestSessionsOfAllTestersFinished && setTimeout(() => { respToolkit.event(null); }, 10000);
    // Now we just close from client side, so client doesn't keep trying to re-establish.
  }

  #lpTesterWatcherCallback(chan, message) {
    // We use event 'testerMessage' when the Redis client returns a nil multi-bulk (The event type is arbitrary if there was no message) and 'testerMessage' is the easiest to handle in the CLI.
    //   This is what happens when we blpop (blocking lpop) and it times out waiting for a message to be available on the given list.
    //   So there is actually no message published from any Tester.
    const nonNullMessage = (message) || { id: Date.now(), event: 'testerProgress', data: { progress: null } };
    const update = typeof nonNullMessage === 'string' ? Bourne.parse(nonNullMessage) : nonNullMessage;
    const { dataMap, allTestSessionsOfAllTestersFinished } = this.#processTesterFeedbackMessageForCli({ update, chan });
    if (allTestSessionsOfAllTestersFinished) {
      this.resetTesters({});
      this.#archiveOutcomes();
    }
    update.data = dataMap;
    return update;
  }

  async #clearOutcomesDir() {
    // const promiseToChmod = promisify(fs.chmod);
    const { dir } = this.#outcomesConfig;

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
      this.#log.error(`${errorMessage} The error was: ${e}.`, { tags: ['orchestrate'] });
      const error = new Error(errorMessage);
      // Errors with statusCode 500 have their messages hidden from the end user: https://hapi.dev/module/boom/api/?v=9.1.0#http-5xx-errors
      //   So if you want the user to see something at all useful, don't use 500.
      error.statusCode = 512;
      throw error;
    }
  }

  getOutcomesArchiveFilePath() {
    const { dir, fileName } = this.#outcomesConfig;
    return `${dir}${fileName}`;
  }

  async testTeamPlan(testJob) {
    this.#log.notice(`The Job used to "plan" with, after validation and any modifications, was:\n${JobMaskPassword(testJob)}\n\n`, { tags: ['orchestrate'] });
    const combinedTestPlanResult = this.#testerModels.map((testerModel) => testerModel.plan(testJob));
    const teamPlanResponses = await Promise.all(combinedTestPlanResult);
    return teamPlanResponses;
  }

  // Subscribe to Test Sessions. If we don't, and one finishes before the subscriptions are set-up... due to the CLI retrying,
  // we never receive the vital "Tester finished:" message, so we never clean-up for the next Test Run.
  async #warmUpTestSessionMessageChannels() {
    this.#warmUpTestSessionMessageSets = [];
    const channelNames = this.#testerModels.flatMap((tM) => tM.jobTestSessions().map((jTS) => `${tM.name}-${jTS.id}`));
    const emptyTesterMessageSets = channelNames.map((cN) => ({ channelName: cN, testerMessageSet: [] }));
    const warmUp = true;
    this.#warmUpTestSessionMessageSets = await Promise.all(emptyTesterMessageSets.map(async (tMS) => (
      { channelName: tMS.channelName, testerMessageSet: await this.pollTesterMessages(tMS.channelName, warmUp) }
    )));
  }

  async #startTesters({ failedTesterInitialisations, startTesters, combinedInitTesterResponses }) {
    const start = {
      false: async () => {
        await this.resetTesters({ level: 'hard' });
        return combinedInitTesterResponses.map((iTR) => failedTesterInitialisations.length // eslint-disable-line no-confusing-arrow
          ? {
            name: iTR.name,
            message: `${iTR.message} ${failedTesterInitialisations.reduce((accum, cV) => `${accum ? `${accum}, ` : ''}${cV.name}`, '')} Tester(s) failed initialisation. Test Run aborted.`
          }
          : {
            name: iTR.name,
            message: iTR.message
          });
      },
      true: async () => {
        this.#testerModels.forEach((tM) => tM.startTester());
        // The following means we don't rely on the CLI to subscribe to message channels, thus we should always get the "Tester finished:" message.
        this.#env === 'cloud' && await this.#warmUpTestSessionMessageChannels();
        return combinedInitTesterResponses;
      }
    };
    return start[!failedTesterInitialisations.length || startTesters]();
  }

  async testTeamAttack(testJob) {
    this.#areAllTestSessionsOfAllTestersFinishedOrNonexistent() && await this.#clearOutcomesDir();
    this.#log.info(`The Job used to "attack" with, after validation and any modifications, was:\n${JobMaskPassword(testJob)}\n\n`, { tags: ['orchestrate'] });
    if (this.#initTesterResponsesForCli && this.#initTesterResponsesForCli.length) {
      return { testerStatuses: this.#initTesterResponsesForCli, testerFeedbackCommsMedium: this.#testerWatcher.testerFeedbackCommsMedium };
    }
    if (this.#initTesterResponsesForCli) {
      this.#log.debug('Causing a client-side timeout, to initiate retry.', { tags: ['orchestrate'] });
      /* Cause a timeout so client retries */ return (() => new Promise((resolve) => setTimeout(() => {
        this.#log.debug('Finished waiting to cause client-side timeout.', { tags: ['orchestrate'] });
        resolve();
      }, /* Api Gateway timeout */ 30000)))();
    }

    this.#initTesterResponsesForCli = [];

    const combinedInitTesterPromises = this.#testerModels.map((testerModel) => testerModel.initTester(testJob));
    const combinedInitTesterResponses = await Promise.all(combinedInitTesterPromises);

    combinedInitTesterResponses.forEach((iTR) => { this.#log.info(`Tester name: ${iTR.name}, Tester message: ${iTR.message}`, { tags: ['orchestrate'] }); });

    const failedTesterInitialisations = combinedInitTesterResponses.filter((cV) => cV.message.startsWith('Tester failure:')); // CLI apiDecoratingAdapter depends on this string.

    const startTesters = combinedInitTesterResponses.every((iTR) => {
      const isActive = this.#testerModels.find((tM) => tM.name === iTR.name).isActive();
      const testerInitialised = iTR.message.startsWith('Tester initialised.');
      return (isActive && testerInitialised) || !isActive;
    });
    this.#log.info(`${startTesters ? 'S' : 'Not s'}tarting ${startTesters ? 'all' : 'any'} active Testers.`, { tags: ['orchestrate'] });
    this.#initTesterResponsesForCli = await this.#startTesters({ failedTesterInitialisations, startTesters, combinedInitTesterResponses });
    return {
      testerStatuses: this.#initTesterResponsesForCli,
      testerFeedbackCommsMedium: this.#testerWatcher.testerFeedbackCommsMedium
    };
  }

  initSSE(channel, event, respToolkit) {
    const testerWatcherCallbackClosure = (chan, message) => {
      this.#sseTesterWatcherCallback(chan, message, respToolkit);
    };

    this.#testerWatcher.subscribe(channel, testerWatcherCallbackClosure);
    const initialEvent = { id: Date.now(), event, data: { progress: `Initialising SSE subscription to "${channel}" channel for the event "${event}".` } };
    const initialResponse = respToolkit.event(initialEvent);
    return initialResponse;
    // To cancel the event stream:
    //    https://github.com/mtharrison/susie#how-do-i-finish-a-sse-stream-for-good
    //    https://www.html5rocks.com/en/tutorials/eventsource/basics/#toc-canceling
  }

  async #getTesterMessages(channel) {
    const testerWatcherCallbackClosure = (chan, message) => this.#lpTesterWatcherCallback(chan, message);
    const testerMessageSet = await this.#testerWatcher.pollTesterMessages(channel, testerWatcherCallbackClosure);
    return testerMessageSet;
  }

  async pollTesterMessages(channel, warmUp = false) {
    let testerMessageSet;
    if (!warmUp) {
      const index = this.#warmUpTestSessionMessageSets.findIndex((tSMS) => tSMS.channelName === channel);
      if (index > -1) {
        testerMessageSet = this.#warmUpTestSessionMessageSets.splice(index, 1)[0].testerMessageSet;
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
