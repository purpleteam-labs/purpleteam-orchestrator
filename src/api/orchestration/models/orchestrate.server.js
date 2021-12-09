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

const log = require('purpleteam-logger').get(); // eslint-disable-line no-unused-vars
const { Orchestration: { TesterUnavailable, TestPlanUnavailable } } = require('src/strings');

const internals = {
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
