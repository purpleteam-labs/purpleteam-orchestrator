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

/* eslint-disable */
exports.lab = require('@hapi/lab').script();

const { describe, it } = exports.lab;

const { expect, fail } = require('@hapi/code');
// const sinon = require('sinon');
// const rewire = require('rewire');

const config = require('config/config');
const log = require('purpleteam-logger').init(config.get('logger'));
const Orchestrate = require('src/api/orchestration/models/orchestrate');


describe('orchestrate model', /* async */ () => {
  it('- ', () => {
    const modelOpts = { log, testers: 'testers', testerMatcher: 'testerMatcher' };
    const model = new Orchestrate(modelOpts);
  });
});
