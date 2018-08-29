/* eslint-disable */
require('app-module-path').addPath(process.cwd());
exports.lab = require('lab').script();

const { describe, it, before, beforeEach } = exports.lab;

const { expect } = require('code');
const sinon = require('sinon');
const rewire = require('rewire');
const readFileAsync = require('util').promisify(require('fs').readFile);
const config = require('config/config');
const log = require('purpleteam-logger').init(config.get('logger'));


describe('apiDecoratingAdapter', () => {
  describe('getTestPlans', () => {    
    it('- test 0', async (flags) => {
      expect(true).to.equal(true);
    });
    it('- test 1', async (flags) => {
      expect(true).to.equal(true);
    });
    describe('suite 1', () => {
      it('- test 2', async (flags) => {
        expect(true).to.equal(true);
      });
      it('- test 3', async (flags) => {
        expect(true).to.equal(true);
      });
      describe('suite 1', () => {
        it('- test 4', async (flags) => {
          expect(true).to.equal(true);
        });
        it('- test 5', async (flags) => {
          expect(true).to.equal(true);
        });
      })
    
    });
    
    
    
  });
});

