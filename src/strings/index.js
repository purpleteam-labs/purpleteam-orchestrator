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

const Bourne = require('@hapi/bourne');

const Orchestration = {
  TesterUnavailable: (tester) => `No ${tester} testing available currently. The ${tester} tester is currently in-active.`,
  TestPlanUnavailable: (tester) => `No test plan available for the ${tester} tester. The ${tester} tester is currently in-active.`,
  BuildUserConfigMaskPassword: (config) => {
    let configClone;

    if (typeof config === 'string') {
      try {
        configClone = Bourne.parse(config);
      } catch (e) {
        return 'JSON parsing failed. Build user config was invalid JSON.';
      }
    } else {
      configClone = config;
    }

    try {
      configClone.included.forEach((resourceObject) => { if (resourceObject.type === 'testSession' && resourceObject.attributes && resourceObject.attributes.password) resourceObject.attributes.password = '******'; }); // eslint-disable-line no-param-reassign
      return JSON.stringify(configClone, null, '  ');
    } catch (e) {
      return 'JSON parsing failed. Build user config was incomplete or invalid JSON';
    }
  }

};

module.exports = { Orchestration };
