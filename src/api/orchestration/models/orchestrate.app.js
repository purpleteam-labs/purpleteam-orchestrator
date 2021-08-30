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

const log = require('purpleteam-logger').get();
const Wreck = require('@hapi/wreck');
const Bourne = require('@hapi/bourne');
const { Orchestration: { TesterUnavailable, TestPlanUnavailable } } = require('src/strings');

const internals = {
  testerConfig: null,
  jobTestSessions: []
};


const init = (testerConfig) => {
  if (!internals.testerConfig) internals.testerConfig = testerConfig;
};


const isActive = () => internals.testerConfig.active;


async function plan(testJob) {
  const { testerConfig: { name, url, testPlanRoute } } = internals;

  if (!isActive()) return { name, message: TestPlanUnavailable(name) };

  const promisedResponse = Wreck.post(`${url}${testPlanRoute}`, { headers: { 'content-type': 'application/vnd.api+json' }, payload: testJob });
  try {
    const { res, payload } = await promisedResponse; // eslint-disable-line no-unused-vars
    const testPlanPayload = payload.toString();

    log.info(`\n${testPlanPayload}`, { tags: ['orchestrate.app'] });
    return { name, message: testPlanPayload };
  } catch (e) {
    const handle = {
      errorMessageFrame: (innerMessage) => `Error occurred while attempting to retrieve your test plan. Error was: ${innerMessage}`,
      buildUserMessage: '"App Tester is currently unreachable"',
      isBoom: () => e.output.payload,
      notBoom: () => e.message
    };
    log.alert(handle.errorMessageFrame(JSON.stringify(handle[e.isBoom ? 'isBoom' : 'notBoom']())), { tags: ['orchestrate.app'] });

    return { name, message: handle.errorMessageFrame(handle.buildUserMessage) };
  }
}


async function initTester(testJob) {
  const { testerConfig: { name, url, initTesterRoute } } = internals;

  if (!isActive()) return { name, message: TesterUnavailable(name) };

  const hydratedTestJob = Bourne.parse(testJob);
  const validNumberOfResourceObjects = (() => {
    const numberOfAppScannerResourceObjects = hydratedTestJob.included.filter((resourceObj) => resourceObj.type === 'appScanner').length;
    return numberOfAppScannerResourceObjects > 0 && numberOfAppScannerResourceObjects <= 12;
  })();

  if (!validNumberOfResourceObjects) return { name, message: 'Tester failure: The only valid number of appScanner resource objects is from 1-12 inclusive. Please modify your Job file.' };
  internals.jobTestSessions = hydratedTestJob.included.filter((resourceObj) => resourceObj.type === 'appScanner').map((testSessionResourceObj) => ({ id: testSessionResourceObj.id, isFinished: false }));

  const { res, payload } = await Wreck.post(`${url}${initTesterRoute}`, { headers: { 'content-type': 'application/vnd.api+json' }, payload: testJob }); // eslint-disable-line no-unused-vars
  // Todo: Provide similar error handling to plan.
  const initTesterPayload = payload.toString();
  log.info(initTesterPayload, { tags: ['orchestrate.app'] });

  return { name, message: initTesterPayload };
}


function startTester() {
  const { testerConfig: { url, startTesterRoute } } = internals;
  if (!isActive()) return;
  Wreck.post(`${url}${startTesterRoute}`);
}


const setTestSessionFinished = (testSessionId) => {
  const { jobTestSessions } = internals;

  if (!testSessionId) throw new Error('There was no testSessionId supplied to the setTestSessionFinished function of the app model');
  if (typeof testSessionId !== 'string') throw new Error('"testSessionId" must be a string');

  jobTestSessions.find((tS) => tS.id === testSessionId).isFinished = true;
};


const testerFinished = () => internals.jobTestSessions.every((tS) => tS.isFinished);
const jobTestSessions = () => internals.jobTestSessions;

module.exports = {
  init,
  isActive,
  plan,
  initTester,
  startTester,
  setTestSessionFinished,
  testerFinished,
  jobTestSessions
};
