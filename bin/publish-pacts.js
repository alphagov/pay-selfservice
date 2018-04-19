#!/usr/bin/env node
let pact = require('@pact-foundation/pact-node')
let opts = {
  pactFilesOrDirs: [`${__dirname}/../pacts/*`],
  pactBroker: '${PACT_BROKER_URL:https://pact-broker-test.cloudapps.digital/}',
  consumerVersion: '${PACT_CONSUMER_VERSION}',
  pactBrokerUsername: '${PACT_BROKER_USERNAME:bob}',
  pactBrokerPassword: '${PACT_BROKER_PASSWORD:bob}',
  tags: '${PACT_CONSUMER_TAG}'
}

pact.publishPacts(opts).then(function () {
  console.log('>> Pact files have been published')
})
