<div align="center">
  <br/>
  <a href="https://purpleteam-labs.com" title="purpleteam">
    <img width=900px src="https://gitlab.com/purpleteam-labs/purpleteam/raw/master/assets/images/purpleteam-banner.png" alt="purpleteam logo">
  </a>
  <br/>
<br/>
<h2>purpleteam orchestrator</h2><br/>
  Currently in heavy development
<br/><br/>

<a href="https://gitlab.com/purpleteam-labs/purpleteam-orchestrator/commits/master" title="pipeline status">
   <img src="https://gitlab.com/purpleteam-labs/purpleteam-orchestrator/badges/master/pipeline.svg" alt="pipeline status">
</a>

<a href="https://gitlab.com/purpleteam-labs/purpleteam-orchestrator/commits/master" title="test coverage">
   <img src="https://gitlab.com/purpleteam-labs/purpleteam-orchestrator/badges/master/coverage.svg" alt="test coverage">
</a>

<a href="https://snyk.io/test/github/purpleteam-labs/purpleteam-orchestrator?targetFile=package.json" title="known vulnerabilities">
  <img src="https://snyk.io/test/github/purpleteam-labs/purpleteam-orchestrator/badge.svg?targetFile=package.json" alt="known vulnerabilities"/>
</a>

<br/><br/><br/>
</div>


Along with the other components in the PurpleTeam solution:

* [purpleteam](https://gitlab.com/purpleteam-labs/purpleteam) (node.js CLI, driven from CI / nightly build)
* [purpleteam-orchestrator](https://gitlab.com/purpleteam-labs/purpleteam-orchestrator) (hapi.js orchestrator - SaaS interface, this package)
* purpleteam-advisor (machine learning module which continuously improves tests, plugs into orchestrator, future roadmap)
* Testers:
  * [purpleteam-app-scanner](https://gitlab.com/purpleteam-labs/purpleteam-app-scanner) (web app / api scanner)
  * purpleteam-server-scanner (web server scanner)
  * purpleteam-tls-checker (TLS checker)
  * etc

## Definitions

Described [here](https://gitlab.com/purpleteam-labs/purpleteam#definitions).

## Setup

Once cloned, from the terminal run:
  
`npm install`
  
## Exercising the `/test`

1. Run [purpleteam-app-scanner](https://gitlab.com/purpleteam-labs/purpleteam-app-scanner)
2. `npm start` the Orchestrator
3. Send `POST` request conforming to [JSONAPI](http://jsonapi.org) including the details required to orchestrate the Testers
  * [purpleteam-app-scanner](https://gitlab.com/purpleteam-labs/purpleteam-app-scanner) writes the test results to its terminal and returns the test plan
  * Orchestrator then requests to be kept up to date with the test results
    * [purpleteam-app-scanner](https://gitlab.com/purpleteam-labs/purpleteam-app-scanner) sends results as JSON by way of Server Sent Events (SSE)
    * Orchestrator writes to terminal the JSON test results using an `EventSource`'d function provided to the [purpleteam-app-scanner](https://gitlab.com/purpleteam-labs/purpleteam-app-scanner)'s `/test-results` route

## Exercising the `/test/progress`

This route is intended to eventually provide on demand feedback as to purpleteam's test progress. Currently it returns the text "cats".

`curl http://localhost:2000/test/progress`

