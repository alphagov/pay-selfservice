'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')

const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const existingGatewayAccountId = 666

// Global setup

describe('connector client - patch google pay toggle (enabled) request', () => {
  const patchRequestParams = { path: 'allow_google_pay', value: true }
  const request = gatewayAccountFixtures.validGatewayAccountPatchRequest(patchRequestParams).getPlain()

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

  describe('google pay toggle - supported payment provider request', () => {
    const googlePayToggleSupportedPaymentProviderState =
      `a gateway account supporting digital wallet with external id ${existingGatewayAccountId} exists in the database`

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}`)
          .withUponReceiving('a valid patch google pay toggle (enabled) request')
          .withState(googlePayToggleSupportedPaymentProviderState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build())
    })

    afterEach(() => provider.verify())

    it('should toggle successfully', () => {
      return connectorClient.toggleGooglePay(existingGatewayAccountId, true, null)
    })
  })

  describe('google pay toggle with unsupported payment provider request', () => {
    const googlePayToggleUnsupportedPaymentProviderState = `User ${existingGatewayAccountId} exists in the database`

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}`)
          .withUponReceiving('a valid patch google pay toggle (enabled) request')
          .withState(googlePayToggleUnsupportedPaymentProviderState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(400)
          .build())
    })

    afterEach(() => provider.verify())

    it('should respond bad request for unsupported payment provider', () => {
      return connectorClient.toggleGooglePay(existingGatewayAccountId, true, null)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).to.equal(400)
        )
    })
  })
})
