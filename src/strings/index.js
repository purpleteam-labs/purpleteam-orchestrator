const Orchestration = {
  TesterUnavailable: tester => `No ${tester} testing available currently. The ${tester} tester is currently in-active.`,
  TestPlanUnavailable: tester => `No test plan available for the ${tester} tester. The ${tester} tester is currently in-active.`,
  BuildUserConfigMaskPassword: (config) => {
    let configClone;

    if (typeof config === 'string') {
      try {
        configClone = JSON.parse(config);
      }
      catch (e) {
        return 'JSON parsing failed. Build user config was invalid JSON.'
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

module.exports = {
  Orchestration
};
