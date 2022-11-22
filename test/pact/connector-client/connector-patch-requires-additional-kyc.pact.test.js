'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')

const existingGatewayAccountId = 42
const defaultState = `a stripe gateway account with external id ${existingGatewayAccountId} exists in the database`

let connectorClient

describe('connector client - patch gateway account requires additional kyc', () => {
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
    connectorClient = new Connector(`http://localhost:${opts.port}`)
  })
  after(() => provider.finalize())

  describe('when a request to disable requires additional kyc data flag is made', () => {
    const request = gatewayAccountFixtures.validGatewayAccountPatchRequiresAdditionalKycDataRequest()

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`/v1/api/accounts/${existingGatewayAccountId}`)
          .withState(defaultState)
          .withUponReceiving('a request to disable the requires additional kyc data flag')
          .withMethod('PATCH')
          .withRequestHeaders({ 'Content-Type': 'application/json' })
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build())
    })

    afterEach(() => provider.verify())

    it('should disable flag', async () => {
      await connectorClient.disableCollectAdditionalKyc(existingGatewayAccountId, 'correlation-id')
    })
  })
})
