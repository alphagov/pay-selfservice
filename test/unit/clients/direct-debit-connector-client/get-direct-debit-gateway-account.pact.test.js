'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const { PactInteractionBuilder } = require('../../../fixtures/pact-interaction-builder')
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')
const getDirectDebitConnectorClient = require('../../../../app/services/clients/direct-debit-connector.client2')
const GatewayAccount = require('../../../../app/models/DirectDebitGatewayAccount.class')

// Constants
const port = Math.floor(Math.random() * 48127) + 1024
const directDebitConnectorClient = getDirectDebitConnectorClient({ baseUrl: `http://localhost:${port}` })

// Global setup

const existingDirectDebitGatewayAccountId = 667

describe('connector client - get gateway account', () => {
  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'direct-debit-connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('get single gateway account - success', () => {
    const validGetGatewayAccountResponse = gatewayAccountFixtures.validDirectDebitGatewayAccountResponse({
      gateway_account_id: existingDirectDebitGatewayAccountId
    })

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`/v1/api/accounts/${existingDirectDebitGatewayAccountId}`)
          .withUponReceiving('a valid get gateway account request')
          .withState(`Direct Debit gateway account with id ${existingDirectDebitGatewayAccountId} exists in the database`)
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
      const gatewayAccount = new GatewayAccount(validGetGatewayAccountResponse.getPlain())
      const params = {
        gatewayAccountId: existingDirectDebitGatewayAccountId,
        correlationId: null
      }
      return directDebitConnectorClient.getGatewayAccountByExternalId(params)
        .then((response) => {
          expect(response).toEqual(gatewayAccount)
        });
    })
  })
})
