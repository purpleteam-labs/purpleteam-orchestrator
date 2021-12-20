// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

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

    log.info(`\n${testPlanPayload}`, { tags: ['orchestrate.tls'] });
    return { name, message: testPlanPayload };
  } catch (e) {
    const handle = {
      errorMessageFrame: (innerMessage) => `Error occured while attempting to retrieve your test plan. Error was: ${innerMessage}`,
      buildUserMessage: '"Tls Tester is currently unreachable"',
      isBoom: () => e.output.payload,
      notBoom: () => e.message
    };
    log.alert(handle.errorMessageFrame(JSON.stringify(handle[e.isBoom ? 'isBoom' : 'notBoom']())), { tags: ['orchestrate.app'] });

    return { name, message: handle.errorMessageFrame(handle.buildUserMessage) };
  }
}

async function initTester(testJob) {
  const { testerConfig: { name, url, initTesterRoute, minNum, maxNum } } = internals;

  if (!isActive()) return { name, message: TesterUnavailable(name) };

  const hydratedTestJob = Bourne.parse(testJob);
  const validNumberOfResourceObjects = (() => {
    const numberOfTlsScannerResourceObjects = hydratedTestJob.included.filter((resourceObj) => resourceObj.type === 'tlsScanner').length;
    return numberOfTlsScannerResourceObjects >= minNum && numberOfTlsScannerResourceObjects <= maxNum;
  })();

  if (!validNumberOfResourceObjects) return { name, message: `Tester failure: The only valid number of tlsScanner resource objects is${minNum === maxNum ? `: "${minNum}"` : ` from: "${minNum}-${maxNum}"`}. Please modify your Job file.` };
  internals.jobTestSessions = hydratedTestJob.included.filter((resourceObj) => resourceObj.type === 'tlsScanner').map((testSessionResourceObj) => ({ id: testSessionResourceObj.id, isFinished: false }));

  const { res, payload } = await Wreck.post(`${url}${initTesterRoute}`, { headers: { 'content-type': 'application/vnd.api+json' }, payload: testJob }); // eslint-disable-line no-unused-vars
  // Todo: Provide similar error handling to plan.
  const initTesterPayload = payload.toString();
  log.info(initTesterPayload, { tags: ['orchestrate.tls'] });

  return { name, message: initTesterPayload };
}

function startTester() {
  const { testerConfig: { url, startTesterRoute } } = internals;
  if (!isActive()) return;
  Wreck.post(`${url}${startTesterRoute}`);
}

const setTestSessionFinished = (testSessionId) => {
  const { jobTestSessions } = internals;

  if (!testSessionId) throw new Error('There was no testSessionId supplied to the setTestSessionFinished function of the tls model');
  if (typeof testSessionId !== 'string') throw new Error('"testSessionId" must be a string');

  jobTestSessions.find((tS) => tS.id === testSessionId).isFinished = true;
};

const testerFinished = () => internals.jobTestSessions.every((tS) => tS.isFinished);
const jobTestSessions = () => internals.jobTestSessions;

const reset = async () => {
  const { testerConfig: { url, resetTesterRoute } } = internals;
  internals.jobTestSessions = [];
  await Wreck.post(`${url}${resetTesterRoute}`, { headers: { 'content-type': 'application/vnd.api+json' }, payload: '{}' });
  log.info('Reset command has been sent to Tester.', { tags: ['orchestrate.tls'] });
};

module.exports = {
  init,
  isActive,
  plan,
  initTester,
  startTester,
  setTestSessionFinished,
  testerFinished,
  jobTestSessions,
  reset
};
