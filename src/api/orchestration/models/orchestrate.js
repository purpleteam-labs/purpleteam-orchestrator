let testerModels;

( async () => {
  const fs = require('fs');
  const { promisify } = require('util');
  const promiseToReadDir = promisify(fs.readdir);
  const modelNameParts = {domain: 0, testerType: 1, fileExtension: 2};
  const modelFileNames = await promiseToReadDir(__dirname);  
  const subModelFileNames = modelFileNames.filter( fileName => fileName === 'index.js' ? false : !(fileName.startsWith('.js', 11)) );  
  testerModels = subModelFileNames.map(fileName => ( { ...require(`./${fileName}`), name: fileName.split('.')[modelNameParts.testerType] } ) );
})();


class Orchestrate {
  constructor(config) {
    const { testers } = config;
    this.testersConfig = testers;

    
  }

  async testTeam(testJob) {


    // Create job for each tester
    //    Each job contains collection of testSession, if relevant for tester.

    // Deploy each tester.
    

    const combinedTestPlan = testerModels.map( testerModel => 
      testerModel.attack(testJob, this.testersConfig[testerModel.name])
    );


/*

    let testerProgressEventSources = testerModels.map(
      testerModel => {
        const eventSource = new EventSource(`${this.testersConfig[testerModel.name].url}${this.testersConfig[testerModel.name].testResultRoute}`);


        eventSource.addEventListener(`${testerModel.name}TestingResult`, (event) => {      
          //const dataFormat = Object.prototype.hasOwnProperty.call(event, 'dataFormat') ? event.dataFormat : null;
          //console.log(dataFormat === 'json' ? JSON.parse(event.data) : event.data);
          console.log(JSON.parse(event.data).testingResult);
        });

        return eventSource;

      }
    );
/*

/*
    let eventSource = new EventSource(`${appScannerUrl}${testResultRoute}`);
    eventSource.addEventListener('result', (event) => {      
      //const dataFormat = Object.prototype.hasOwnProperty.call(event, 'dataFormat') ? event.dataFormat : null;
      //console.log(dataFormat === 'json' ? JSON.parse(event.data) : event.data);
      console.log(JSON.parse(event.data).testingResult);
    })
*/


    return (await Promise.all(combinedTestPlan)).reduce((combined, plan) => `${combined}\n\n${plan}`);
    
    

  }
}

module.exports = Orchestrate;
