// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of purpleteam.

// purpleteam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// purpleteam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with purpleteam. If not, see <https://www.gnu.org/licenses/>.

const log = require('purpleteam-logger').get(); // eslint-disable-line no-unused-vars
const { Orchestration: { TesterUnavailable, TestPlanUnavailable } } = require('src/strings');


const internals = {
  testerConfig: null,
  testSessions: []
};


const init = (testerConfig) => {
  if (!internals.testerConfig) internals.testerConfig = testerConfig;
};


const isActive = () => internals.testerConfig.active;


async function plan(testJob) { // eslint-disable-line no-unused-vars
  const { testerConfig: { name, url, testPlanRoute } } = internals; // eslint-disable-line no-unused-vars

  if (!isActive()) return { name, message: TestPlanUnavailable(name) };

  throw new Error('Function "plan" of server tester is not implemented!');
}


async function attack(testJob) { // eslint-disable-line no-unused-vars
  const { testerConfig: { name, url, runJobRoute, testResultRoute } } = internals; // eslint-disable-line no-unused-vars

  if (!isActive()) return { name, message: TesterUnavailable(name) };

  throw new Error('Function "attack" of server tester is not implemented!');
}


const setTestSessionFinished = (testSessionId) => { // eslint-disable-line no-unused-vars
  throw new Error('Function "setTestSessionFinished" of server tester is not implemented!');
};


const areAllTestSessionsFinishedOrNoneExist = () => { throw new Error('Function "areAllTestSessionsFinishedOrNoneExist" of server tester is not implemented!'); };


module.exports = {
  init,
  isActive,
  plan,
  attack,
  setTestSessionFinished,
  areAllTestSessionsFinishedOrNoneExist
};
