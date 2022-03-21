// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

import { get as getLogger } from 'purpleteam-logger';
import { Orchestration } from '../../../strings/index.js';

const { TesterUnavailable, TestPlanUnavailable } = Orchestration;

const internals = {
  log: getLogger(),
  testerConfig: null,
  jobTestSessions: []
};

const init = (testerConfig) => {
  if (!internals.testerConfig) internals.testerConfig = testerConfig;
};

const isActive = () => internals.testerConfig.active;

async function plan(testJob) { // eslint-disable-line no-unused-vars
  const { testerConfig: { name, url, testPlanRoute } } = internals; // eslint-disable-line no-unused-vars

  if (!isActive()) return { name, message: TestPlanUnavailable(name) };

  throw new Error('Function "plan" of server Tester is not implemented!');
}

async function initTester(testJob) { // eslint-disable-line no-unused-vars
  const { testerConfig: { name, url, initTesterRoute, minNum, maxNum } } = internals; // eslint-disable-line no-unused-vars

  internals.jobTestSessions = [{ id: 'NA' }];

  if (!isActive()) return { name, message: TesterUnavailable(name) };

  throw new Error('Function "initTester" of server Tester is not implemented!');
}

function startTester() {
  const { testerConfig: { url, startTesterRoute } } = internals; // eslint-disable-line no-unused-vars
  if (!isActive()) return;

  throw new Error('Function "startTester" of server Tester is not implemented!');
}

const setTestSessionFinished = (testSessionId) => { // eslint-disable-line no-unused-vars
  throw new Error('Function "setTestSessionFinished" of server Tester is not implemented!');
};

const testerFinished = () => { throw new Error('Function "testerFinished" of server Tester is not implemented!'); };
const jobTestSessions = () => internals.jobTestSessions;

const reset = async () => {
  throw new Error('Function "reset" of server Tester is not implemented!');
};

export {
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
