#!/usr/bin/env node
/* eslint-disable no-template-curly-in-string */
let pact = require('@pact-foundation/pact-node')
let opts = {
  pactFilesOrDirs: [`${__dirname}/../pacts/*`],
  pactBroker: '${PACT_BROKER_URL}',
  consumerVersion: '${PACT_CONSUMER_VERSION}',
  pactBrokerUsername: '${PACT_BROKER_USERNAME}',
  pactBrokerPassword: '${PACT_BROKER_PASSWORD}',
  tags: '${PACT_CONSUMER_TAG}'
}

pact.publishPacts(opts).then(function () {
  console.log('>> Pact files have been published')
})
