// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

const Bourne = require('@hapi/bourne');

const Orchestration = {
  TesterUnavailable: (tester) => `No ${tester} testing available currently. The ${tester} Tester is currently in-active.`, // Should match CLI.
  TestPlanUnavailable: (tester) => `No test plan available for the ${tester} Tester. The ${tester} Tester is currently in-active.`, // Should match CLI.
  JobMaskPassword: (config) => {
    let configClone;

    if (typeof config === 'string') {
      try {
        configClone = Bourne.parse(config);
      } catch (e) {
        return 'JSON parsing failed. Job was invalid JSON.';
      }
    } else {
      configClone = config;
    }

    try {
      configClone.included.forEach((resourceObject) => { if (resourceObject.type === 'appScanner' && resourceObject.attributes && resourceObject.attributes.password) resourceObject.attributes.password = '******'; }); // eslint-disable-line no-param-reassign
      return JSON.stringify(configClone, null, '  ');
    } catch (e) {
      return 'JSON parsing failed. Job was incomplete or invalid JSON';
    }
  }

};

module.exports = { Orchestration };
