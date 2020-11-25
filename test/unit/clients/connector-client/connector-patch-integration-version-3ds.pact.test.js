'use strict'

// NPM dependencies
const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')

const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = 42
const defaultState = `Gateway account ${existingGatewayAccountId} exists and has a charge for £1 with id abc123`

describe('Update 3DS integration version', () => {
  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('Update 3DS integration version to 1', () => {
    const patchRequestParams = { path: 'integration_version_3ds', value: 1 }
    const request = gatewayAccountFixtures.validGatewayAccountPatchRequest(patchRequestParams).getPlain()

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}`)
          .withUponReceiving('a valid patch 3DS integration version to 1 request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build())
    })

    afterEach(() => provider.verify())

    it('should set version to 1 successfully', done => {
      connectorClient.updateIntegrationVersion3ds(existingGatewayAccountId, 1, null)
        .should.be.fulfilled
        .notify(done)
    })
  })

  describe('Update 3DS integration version to 2', () => {
    const patchRequestParams = { path: 'integration_version_3ds', value: 2 }
    const request = gatewayAccountFixtures.validGatewayAccountPatchRequest(patchRequestParams).getPlain()

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}`)
          .withUponReceiving('a valid patch 3DS integration version to 2 request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build())
    })

    afterEach(() => provider.verify())

    it('should set version to 2 successfully', done => {
      connectorClient.updateIntegrationVersion3ds(existingGatewayAccountId, 2, null)
        .should.be.fulfilled
        .notify(done)
    })
  })
})
