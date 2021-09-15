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
