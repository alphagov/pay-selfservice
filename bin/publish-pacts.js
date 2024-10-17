#!/usr/bin/env node
const { unlink, readdir } = require('fs').promises
const path = require('path')
const pact = require('@pact-foundation/pact-core')
const pactDirPath = path.join(__dirname, '../pacts')
const opts = {
  pactFilesOrDirs: [pactDirPath],
  pactBroker: process.env.PACT_BROKER_URL,
  consumerVersion: process.env.PACT_CONSUMER_VERSION,
  pactBrokerUsername: process.env.PACT_BROKER_USERNAME,
  pactBrokerPassword: process.env.PACT_BROKER_PASSWORD,
  tags: process.env.PACT_CONSUMER_TAG
}

readdir(pactDirPath)
  .then((files) => Promise.all(
    files
      .filter((file) => file.includes('to-be'))
      .map((file) => unlink(path.join(pactDirPath, file)))
  )
  )
  .then(() => pact.publishPacts(opts))
  .then(() => console.log('>> Pact files have been published'))
  .catch((error) => console.log('Failed to publish pacts', error))
