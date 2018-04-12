#!/usr/bin/env node
let pact = require('@pact-foundation/pact-node')
let opts = {
  pactFilesOrDirs: [`${__dirname}/../pacts/*`],
  pactBroker: 'https://pact-broker-test.cloudapps.digital/',
  consumerVersion: '0000001',
  pactBrokerUsername: 'bob',
  pactBrokerPassword: 'bob',
  tags: 'PP-Test-Pact-Versioning, latest'
}

pact.publishPacts(opts).then(function () {
  console.log('>> Pact files have been published')
})
