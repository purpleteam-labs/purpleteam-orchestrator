/* eslint-disable */
exports.lab = require('lab').script();

const { describe, it } = exports.lab;

const { expect, fail } = require('code');
// const sinon = require('sinon');
// const rewire = require('rewire');

const config = require('config/config');
const log = require('purpleteam-logger').init(config.get('logger'));
const Orchestrate = require('src/api/orchestration/models/orchestrate');


describe('orchestrate model', async () => {
  it('- ', () => {
    const modelOpts = { log, testers: 'testers', testerMatcher: 'testerMatcher' };
    const model = new Orchestrate(modelOpts);
  });
});
