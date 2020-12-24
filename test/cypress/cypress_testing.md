# About Cypress tests in selfservice

## How external API requests are stubbed out

We use a virtualisation server called [Mountebank](http://www.mbtest.org/) to stub out calls to external microservices. This is run alongside the Cypress server when the `npm run cypress:server` command is run locally.

In the setup step of every Cypress test, we make a POST request to the running instance of Mountebank to initialise an `Imposter`, giving it an array of stubs to use. An Imposter intercepts all requests made to a particular port on localhost, and attempts to match a request to the stubs it has by matching on the `predicates` for the stub, responding with the `response` defined for the stub if there is a match.

For running Cypress tests, we set the environment variables for the base URLs of all other microservices to use the same host and port as the Mountbank Imposter is initialised on. This means that requests to all microservices will be picked up by the single Imposter.

When an Imposter has been set up on Mountebank, it cannot be modified. There is a global `beforeEach` defined in [support/index.js](./support/index.js) to delete the Imposter before each test runs so it can be initialised again.

_If you get an error with message `Port 8000 is already in use` when running Cypress tests, you've probably tried to set up the imposter twice._

#### Mountebank tips

* Mountebank runs locally on port 2525 by default
* You can see the Imposters currently loaded into Mountebank by making a `GET` request to `http://localhost:2525/imposters`
* You can view the stubs for an imposter by making a `GET` request to `http://localhost:2525/imposters/8000` (replace 8000 if Imposter is initialised on a different port)
* If Mountebank is run with the [`--debug` option](http://www.mbtest.org/docs/commandLine), the stubs array returned by the get imposter request includes a `matches` array, which can be useful for seeing which requests are matched on.

## How we validate stubs used for Cypress tests

All API stubs created for use in Cypress tests must use the [fixture builders](test/fixtures/fixture-builders.md) to generate the body in the request/response. 

These fixture builders generate a well defined JSON structure which should be validated by a well defined suite of Pact tests. This means that if an API contract changes, there is one central place in test code that needs to be updated which will propogate through to the Cypress tests.

## Custom Cypress commands

We use custom Cypress commands for sharing code that is common between tests, such as to set cookies. These are defined in [support/commands.js](./support/commands.js). 