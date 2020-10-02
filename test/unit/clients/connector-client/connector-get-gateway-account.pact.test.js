'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/frontend/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)

// Global setup

const existingGatewayAccountId = 666

describe('connector client - get gateway account', () => {
  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('get single gateway account - success', () => {
    const validGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse({
      gateway_account_id: existingGatewayAccountId
    })

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}`)
          .withUponReceiving('a valid get gateway account request')
          .withState(`User ${existingGatewayAccountId} exists in the database`)
          .withMethod('GET')
          .withResponseBody(validGetGatewayAccountResponse.getPactified())
          .withStatusCode(200)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get gateway account successfully', () => {
      const getGatewayAccount = validGetGatewayAccountResponse.getPlain()
      const params = {
        gatewayAccountId: existingGatewayAccountId,
        correlationId: null
      }
      return connectorClient.getAccount(params).then((response) => {
        expect(response).toEqual(getGatewayAccount)
      });
    })
  })
})
