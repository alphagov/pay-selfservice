'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const path = require('path')

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const { pactify } = require('../../test-helpers/pact/pactifier').defaultPactifier
const { worldpayMerchantDetailOperations } = require('../../../app/utils/credentials')

const existingGatewayAccountId = 333
const existingGatewayAccountCredentialsId = 444

let connectorClient

describe('connector client - patch gateway account credentials for one off transactions', () => {
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

  describe('when a request to update credentials map for one off credentials is made', () => {
    const credentialsInRequest = {
      username: 'a-username',
      password: 'a-password', // pragma: allowlist secret
      merchant_code: 'a-merchant-code'
    }
    const credentialsInResponse = {
      one_off_customer_initiated: {
        username: 'a-username',
        merchant_code: 'a-merchant-code'
      }
    }
    const userExternalId = 'a-user-external-id'
    const request = gatewayAccountFixtures.validUpdateGatewayAccountCredentialsRequest({
      credentials: credentialsInRequest,
      path: worldpayMerchantDetailOperations.ONE_OFF_CUSTOMER_INITIATED.patch,
      userExternalId
    })
    const response = gatewayAccountFixtures.validGatewayAccountCredentialsResponse({
      credentials: credentialsInResponse,
      lastUpdatedByUserExternalId: userExternalId
    })

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`/v1/api/accounts/${existingGatewayAccountId}/credentials/${existingGatewayAccountCredentialsId}`)
          .withState(`a Worldpay gateway account with id ${existingGatewayAccountId} with gateway account credentials with id ${existingGatewayAccountCredentialsId}`)
          .withUponReceiving('a request to update credentials map for one off credentials')
          .withMethod('PATCH')
          .withRequestHeaders({ 'Content-Type': 'application/json' })
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({ 'Content-Type': 'application/json' })
          .withResponseBody(pactify(response))
          .build())
    })

    afterEach(() => provider.verify())

    it('should patch gateway account credentials for one off transactions', async () => {
      const connectorResponse = await connectorClient.patchAccountGatewayAccountCredentials({
        gatewayAccountId: existingGatewayAccountId,
        gatewayAccountCredentialsId: existingGatewayAccountCredentialsId,
        credentials: credentialsInRequest,
        path: worldpayMerchantDetailOperations.ONE_OFF_CUSTOMER_INITIATED.patch,
        userExternalId
      })
      expect(connectorResponse.credentials).to.deep.equal(credentialsInResponse)
    })
  })
})
