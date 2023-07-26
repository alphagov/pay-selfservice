'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const path = require('path')

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const { pactify } = require('../../test-helpers/pact/pactifier').defaultPactifier

const existingGatewayAccountId = 444
const existingGatewayAccountCredentialsId = 555

let connectorClient

describe('connector client - patch gateway account credentials.state', () => {
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

  describe('when a request to update the state of gateway account credentials is made', () => {
    const state = 'VERIFIED_WITH_LIVE_PAYMENT'
    const userExternalId = 'a-user-external-id'
    const requestPayload = {
      gatewayAccountId: '444',
      gatewayAccountCredentialsId: '555',
      state,
      userExternalId
    }
    const request = gatewayAccountFixtures.validPatchAccountGatewayAccountCredentialsStateRequest(requestPayload)
    const response = gatewayAccountFixtures.validPatchGatewayCredentialsResponse({
      gatewayAccountId: existingGatewayAccountId,
      gatewayAccountCredentialId: existingGatewayAccountCredentialsId,
      state,
      lastUpdatedByUserExternalId: userExternalId
    })

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`/v1/api/accounts/${existingGatewayAccountId}/credentials/${existingGatewayAccountCredentialsId}`)
          .withState(`a Worldpay gateway account with id ${existingGatewayAccountId} with gateway account credentials with id ${existingGatewayAccountCredentialsId} and valid credentials`)
          .withUponReceiving('a request to update state for a gateway account credentials')
          .withMethod('PATCH')
          .withRequestHeaders({ 'Content-Type': 'application/json' })
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({ 'Content-Type': 'application/json' })
          .withResponseBody(pactify(response))
          .build())
    })

    afterEach(() => provider.verify())

    it('should patch gateway credentials state', async () => {
      const connectorResponse = await connectorClient.patchAccountGatewayAccountCredentialsState(requestPayload)
      expect(connectorResponse.state).to.deep.equal(state)
    })
  })
})
