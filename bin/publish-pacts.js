#!/usr/bin/env node
/* eslint-disable node/no-path-concat */
const pact = require('@pact-foundation/pact-node')
const opts = {
  pactFilesOrDirs: [`${__dirname}/../pacts/`],
  pactBroker: process.env.PACT_BROKER_URL,
  consumerVersion: process.env.PACT_CONSUMER_VERSION,
  pactBrokerUsername: process.env.PACT_BROKER_USERNAME,
  pactBrokerPassword: process.env.PACT_BROKER_PASSWORD,
  tags: process.env.PACT_CONSUMER_TAG
}

pact.publishPacts(opts).then(function () {
  console.log('>> Pact files have been published')
})
