const Wreck = require('wreck');
const EventSource = require('eventsource');

const app = require('./test.app');
const server = require('./test.server');
const tls = require('./test.tls');

class Test {
  constructor(config) {
    const { testers } = config;
    this.testersConfig = testers;


    
  }

  async deployTestTeam() {


    // Todo: get collection of testers from config.
    // Todo: call each one.




    const { res, payload } = await Wreck.post('http://127.0.0.1:3000/run-job');
    console.log(payload.toString());



    let eventSource = new EventSource('http://127.0.0.1:3000/test-results');
    eventSource.addEventListener('result', (event) => {

      
      //const dataFormat = Object.prototype.hasOwnProperty.call(event, 'dataFormat') ? event.dataFormat : null;
      //console.log(dataFormat === 'json' ? JSON.parse(event.data) : event.data);
      console.log(JSON.parse(event.data).testingResult);

    })



    

  }
}

module.exports = Test;
