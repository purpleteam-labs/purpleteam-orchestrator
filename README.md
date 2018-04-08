## Currently in heavy development

Along with the other components in the PurpleTeam solution:

* [purpleteam](https://github.com/binarymist/purpleteam) (node.js CLI, driven from CI / nightly build)
* [purpleteam-orchestrator](https://github.com/binarymist/purpleteam-orchestrator) (hapi.js orchestrator - SaaS interface, this package)
* purpleteam-advisor (machine learning module which continuously improves tests, plugs into orchestrator, future roadmap)
* Testers:
  * [purpleteam-app-scanner](https://github.com/binarymist/purpleteam-app-scanner) (web app / api scanner)
  * purpleteam-server-scanner (web server scanner)
  * purpleteam-tls-checker (TLS checker)
  * etc

## Setup

Once cloned, from the terminal run:
  
`npm install`
  
## Exercising the `/test`

1. Run [purpleteam-app-scanner](https://github.com/binarymist/purpleteam-app-scanner)
2. `npm start` the Orchestrator
3. Send `POST` request conforming to [JSONAPI](http://jsonapi.org) including the details required to orchestrate the Testers
  * [purpleteam-app-scanner](https://github.com/binarymist/purpleteam-app-scanner) writes the test results to its terminal and returns the test plan
  * Orchestrator then requests to be kept up to date with the test results
    * [purpleteam-app-scanner](https://github.com/binarymist/purpleteam-app-scanner) sends results as JSON by way of Server Sent Events (SSE)
    * Orchestrator writes to terminal the JSON test results using an `EventSource`'d function provided to the [purpleteam-app-scanner](https://github.com/binarymist/purpleteam-app-scanner)'s `/test-results` route

## Exercising the `/test/progress`

This route is intended to eventually provide on demand feedback as to purpleteam's test progress. Currently it returns the text "cats".

`curl http://localhost:2000/test/progress`

