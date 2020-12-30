<div align="center">
  <br/>
  <a href="https://purpleteam-labs.com" title="purpleteam">
    <img width=900px src="https://gitlab.com/purpleteam-labs/purpleteam/raw/main/assets/images/purpleteam-banner.png" alt="purpleteam logo">
  </a>
  <br/>
<br/>
<h2>purpleteam orchestrator</h2><br/>
  Orchestrator component of <a href="https://purpleteam-labs.com/" title="purpleteam">purpleteam</a> - Currently in alpha
<br/><br/>

<a href="https://gitlab.com/purpleteam-labs/purpleteam-orchestrator/commits/main" title="pipeline status">
   <img src="https://gitlab.com/purpleteam-labs/purpleteam-orchestrator/badges/main/pipeline.svg" alt="pipeline status">
</a>

<a href="https://gitlab.com/purpleteam-labs/purpleteam-orchestrator/commits/main" title="test coverage">
   <img src="https://gitlab.com/purpleteam-labs/purpleteam-orchestrator/badges/main/coverage.svg" alt="test coverage">
</a>

<a href="https://snyk.io/test/github/purpleteam-labs/purpleteam-orchestrator?targetFile=package.json" title="known vulnerabilities">
  <img src="https://snyk.io/test/github/purpleteam-labs/purpleteam-orchestrator/badge.svg?targetFile=package.json" alt="known vulnerabilities"/>
</a>

<br/><br/><br/>
</div>


Clone this repository.

`cd` to the repository root directory and run:  
```shell
npm install
```

# Configuration

Copy the config/config.example.json to config/config.local.json.  
Use the config/config.js for documentation and further examples.  

**`outcomes.dir`** Configure this value. This needs to be a directory of your choosing that both the orchestrator and app-scanner containers use. The `outcomes.dir` value should be the same as the testers `slave.report.dir` and `results.dir` value. The directory you choose and configure needs group `rwx` permissions applied to it becuase the orchestrator and tester containers share the same group, they also read, write and delete outcome files within this directory.

**`testerFeedbackComms.medium`** Long Polling `lp` is supported in both `local` and `cloud` environments. Server Sent Events `sse` is only supported in the `local` environment due to AWS limitations. Both `lp` and `sse` are real-time. Both implementations have their pros and cons.

See the CLI documentation for further details around this value.

