# ADR 002 - In-Project Browser Testing

## Context

As part of our efforts to improve our testing across GOV.UK Pay,
we wish to move browser testing from being tested against a docker-compose version of the entire GOV.UK Pay stack to a stubbed environment testing our Node.js apps in isolation.
This should make it:
- less resource intensive to test an individual app
- make tests across the stack less brittle
- help to better delineate tests across the stack
- allow us to effectively validate client-side javascript enhancements
- allow a greater focus on UI

This is intended to take place alongside or after the implementation of Pact contract testing.
This affords us the opportunity to use generated Pact contracts to stub our other micro-services for the purposes of
these tests. This may be helpful or a hindrance, it is something we need to keep in mind as we proceed.

There are a number of technologies we could use for running our browser tests:
- selenium based test runners i.e webdriver.io, nightwatch.js
- casper.js 
- cypress.io

## Discussion

### Browser Testing Tooling
#### Selenium based tooling
- This would probably be the tooling that we are most familiar with, as we have previously used this on pay-accepttests.
- It can be flakey at times
- Selenium does have limitations
- It can be used to test on multiple browsers
- Nightwatch was horrible to use
- Can be written in mocha style

#### Casper.js
- Can be written in mocha style
- Uses phantom.js or slimer.js, no real browser support

#### Cypress.io
- Cannot be written in mocha style, would necessitate separating tests into 2 types, mocha and cypress
- Has nice interactive GUI for local development, this would help our workflow
- Easy to configure
- Automatically generates videos of tests for debugging
- v.easy to debug tests
- shiny and new

### Stubbing Downstream Services
Any stub that we use would have to be in a separate process to our tests as our tests run in a separate process to our
application.

#### Use a stub generated from our Pacts
- Easy and fast
- Would mean being v.disciplined with our example data in our pacts
- Removes the need to set up data for tests, tests then become cleaner

#### Write our own stub/Use a stubbing service service
- Clearer setup tear down in tests
- More work than using pact
- More flexible as to what data we use
- Removes the need to be quite so strict with the example data in our pacts

## Decision

### Browser Testing Tooling
We should use cypress.io, because:
- this will help us to more cleanly separate integration and unit tests in our app
- gives the nicest feedback loop
- gives the nicest developer workflow

### Stubbing Downstream Services
Initially we should try using our Pact stubs. This may make our tests too brittle or too difficult to write,
if so we should investigate how else we can generate stubs.


## Status


## Consequences
