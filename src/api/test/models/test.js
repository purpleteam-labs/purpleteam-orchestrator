const Wreck = require('wreck');
const EventSource = require('eventsource');

class Test {
  initialise(config) {
    this.config = config;
    console.log(`In the test model's initialise method. The config is: "${this.config}"`); // eslint-disable-line no-console
  }

  async deployTestTeam() {


    const { res, payload } = await Wreck.post('http://127.0.0.1:3000/test-route');
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
