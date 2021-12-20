// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

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
