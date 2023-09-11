'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')

const existingGatewayAccountId = 444

let connectorClient

describe('connector client - post switch payment provider', () => {
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

  describe('when a post to switch payment provider is made', () => {
    const requestPayload = {
      userExternalId: 'a-user-external-id',
      gatewayAccountCredentialExternalId: 'switchto1234'
    }
    const request = gatewayAccountFixtures.validPostAccountSwitchPSPRequest(requestPayload)

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`/v1/api/accounts/${existingGatewayAccountId}/switch-psp`)
          .withState(`a Worldpay gateway account with id ${existingGatewayAccountId} with two credentials ready to be switched`)
          .withUponReceiving('a request to switch payment provider')
          .withMethod('POST')
          .withRequestHeaders({ 'Content-Type': 'application/json' })
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build())
    })

    afterEach(() => provider.verify())

    it('should switch payment provider', done => {
      connectorClient.postAccountSwitchPSP(existingGatewayAccountId, request)
        .should.be.fulfilled
        .notify(done)
    })
  })
})
