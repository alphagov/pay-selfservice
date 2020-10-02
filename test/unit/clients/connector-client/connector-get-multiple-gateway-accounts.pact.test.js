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

describe('connector client - get multiple gateway accounts', () => {
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

  describe('get multiple gateway accounts - success', () => {
    const validGetGatewayAccountsResponse = gatewayAccountFixtures.validGatewayAccountsResponse({
      accounts: [
        { gateway_account_id: 111 },
        { gateway_account_id: 222 }
      ]
    })

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(ACCOUNTS_RESOURCE)
          .withUponReceiving('a valid get gateway accounts request')
          .withState('gateway accounts with ids 111, 222 exist in the database')
          .withMethod('GET')
          .withQuery('accountIds', '111,222')
          .withResponseBody(validGetGatewayAccountsResponse.getPactified())
          .withStatusCode(200)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get multiple gateway accounts successfully', () => {
      const getGatewayAccounts = validGetGatewayAccountsResponse.getPlain()
      return connectorClient.getAccounts({ gatewayAccountIds: [111, 222], correlationId: null })
        .then((response) => {
          expect(response).toEqual(getGatewayAccounts)
        });
    })
  })
})
