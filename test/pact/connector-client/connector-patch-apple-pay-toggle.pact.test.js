'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../src/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
let connectorClient
const existingGatewayAccountId = 666

// Global setup
chai.use(chaiAsPromised)

describe('connector client - patch apple pay toggle (enabled) request', () => {
  const patchRequestParams = { path: 'allow_apple_pay', value: true }
  const request = gatewayAccountFixtures.validGatewayAccountPatchRequest(patchRequestParams)

  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(async () => {
    const opts = await provider.setup()
    connectorClient = new Connector(`http://127.0.0.1:${opts.port}`)
  })
  after(() => provider.finalize())

  describe('apple pay toggle - supported payment provider request', () => {
    const applePayToggleSupportedPaymentProviderState =
      `a gateway account supporting digital wallet with external id ${existingGatewayAccountId} exists in the database`

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}`)
          .withUponReceiving('a valid patch apple pay toggle (enabled) request')
          .withState(applePayToggleSupportedPaymentProviderState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build())
    })

    afterEach(() => provider.verify())

    it('should toggle successfully', done => {
      connectorClient.toggleApplePay(existingGatewayAccountId, true, null)
        .should.be.fulfilled
        .notify(done)
    })
  })
})
