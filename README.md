<div align="center">
  <br/>
  <a href="https://purpleteam-labs.com" title="purpleteam">
    <img width=900px src="https://github.com/purpleteam-labs/purpleteam/blob/main/assets/images/purpleteam-banner.png" alt="purpleteam logo">
  </a>
  <br/>
  <br/>
  <h2>purpleteam orchestrator</h2><br/>
    Orchestrator component of <a href="https://purpleteam-labs.com/" title="purpleteam"><em>PurpleTeam</em></a> - Currently in alpha
  <br/><br/>

  <a href="https://purpleteam-labs.com/doc/" title="documentation">
    <img src="https://img.shields.io/badge/-documentation-blueviolet" alt="documentation">
  </a>

  <a href="https://github.com/purpleteam-labs/purpleteam-orchestrator/commits/main" title="pipeline status">
    <img src="https://github.com/purpleteam-labs/purpleteam-orchestrator/workflows/Node.js%20CI/badge.svg" alt="pipeline status">
  </a>

  <a href='https://coveralls.io/github/purpleteam-labs/purpleteam-orchestrator?branch=main'>
    <img src='https://coveralls.io/repos/github/purpleteam-labs/purpleteam-orchestrator/badge.svg?branch=main' alt='test coverage'>
  </a>
  
  <a href="https://github.com/purpleteam-labs/purpleteam-orchestrator/releases" title="latest release">
    <img src="https://img.shields.io/github/v/release/purpleteam-labs/purpleteam-orchestrator?color=%23794fb8&include_prereleases" alt="GitHub release (latest SemVer including pre-releases)">
  </a>
<br/><br/><br/>
</div>


If you are setting up the _orchestrator_, you will be targeting the `local` environment.

Clone or fork this repository.

If you are developing this project:

`cd` to the repository root directory and run:  
```shell
npm install
```

# Configuration

Copy the config/config.example.json to config/config.local.json.  
Use the config/config.js for documentation and further examples.  

### `testerFeedbackComms.medium`

Long Polling (`lp`) is supported in both `local` and `cloud` environments. Server Sent Events (`sse`) is only supported in the `local` environment due to AWS limitations. Both `lp` and `sse` are real-time. Both implementations have their pros and cons.

The client-side (_PurpleTeam_ CLI) will use the `testerFeedbackComms.medium` that the _orchestrator_ instructs it to use.

#### `sse`

Using `sse` is one way communications after the initial subscription from the CLI to the _orchestrator_. Redis pub/sub is used between the _Testers_ and the _orchestrator_ to publish _Tester_ feedback. If the CLI is stopped (not subscribed) at any point while the back-end is performing a _Test Run_, events will be lost. If the CLI runs `test` again before the _Test Run_ is complete, it will receive messages from then to _Test Run_ completion, and will also receive the _Outcomes_ archive on _Test Run_ completion. If the CLI runs `test` after a _Test Run_ is complete, no messages will be received from the previous _Test Run_, the previous _Test Runs_ _Outcomes_ archive is destroyed, and the CLI will start receiving messages as _Tester_ feedback is produced.

#### `lp`

Using `lp` is request-response communications. A request is made and only answered when there are [_Tester_](https://purpleteam-labs.com/doc/definitions/) feedback messages available, or the application specific (rather than AWS Api Gateway) time-out is exceeded.

As soon as the CLI receives a set (one to many) of _Tester_ feedback messages, it makes another request to the _orchestrator_ (Directly if running in `local` env. Indirectly via the AWS API Gateway if running in `cloud` env). Redis pub/sub is used between the _Testers_ and the _orchestrator_ to publish _Tester_ feedback.  

A little more detail:

If running in the `cloud` environment the first set of _Tester_ feedback messages are persisted in the _orchestrator_'s memory, and subsequent _Tester_ feedback messages are persisted to in-memory Redis lists. The reasons for this are at least two-fold. The _orchestrator_ sets up the subscriptions to the Redis channels on behalf of the CLI. The reasons for this is so that:

* The _orchestrator_ knows when the _Testers_ are finished in order to clean-up before the next _Test Run_
* and to make sure that no messages are missed due to the CLI either being off-line or late to subscribe

This means that if the CLI is stopped momentarily during a _Test Run_ or if _Tester_ messages pile up before the CLI has subscribed (which normally occurs on receipt of the initial set of _Tester_ status messages), as long as the CLI subscribes before the _Test Run_ has completed, it will receive all stored _Tester_ feedback messages and the _Outcomes_ archive when the _Test Run_ is complete.

There are some more details around message flow in [this blog post](https://binarymist.io/blog/2021/09/07/purpleteam-tls-tester-implementation/#message-flows).

> Additional background: This may change in the future, WebSockets is also an option we may implement in the future, but implementing WebSockets would mean we would have to change our entire authn approach. Our chosen cloud infrastructure AWS Api Gateway does not support streaming and it does not support the OAuth Client Credentials Flow with Cognito User Pools.


<br>

Once you have worked through the above steps, head back to the [local setup](https://purpleteam-labs.com/doc/local/set-up/) documentation to continue setting up the other _PurpleTeam_ components.
