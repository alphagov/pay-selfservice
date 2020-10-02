'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)

// Global setup

describe('connector client - create gateway account', () => {
  const provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('create gateway account - success', () => {
    const validCreateGatewayAccountRequest = gatewayAccountFixtures.validCreateGatewayAccountRequest()

    beforeAll((done) => {
      const pactified = validCreateGatewayAccountRequest.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(ACCOUNTS_RESOURCE)
          .withUponReceiving('a valid create gateway account request')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(201)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should submit create gateway account successfully', () => {
      const createGatewayAccount = validCreateGatewayAccountRequest.getPlain()
      return connectorClient.createGatewayAccount(
        createGatewayAccount.payment_provider,
        createGatewayAccount.type,
        createGatewayAccount.service_name,
        createGatewayAccount.analytics_id
      )
    })
  })

  describe('create gateway account - bad request', () => {
    const invalidCreateGatewayAccountRequest = gatewayAccountFixtures.validCreateGatewayAccountRequest()
    const nonExistentPaymentProvider = 'non-existent-payment-provider'
    invalidCreateGatewayAccountRequest.payment_provider = nonExistentPaymentProvider
    const errorResponse = {
      message: `Unsupported payment provider ${nonExistentPaymentProvider}.`
    }

    beforeAll((done) => {
      const pactified = invalidCreateGatewayAccountRequest.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(ACCOUNTS_RESOURCE)
          .withUponReceiving('an invalid create gateway account request')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(400)
          .withResponseBody(errorResponse)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return 400 on missing fields', () => {
      const createGatewayAccount = invalidCreateGatewayAccountRequest.getPlain()
      return connectorClient.createGatewayAccount(
        createGatewayAccount.payment_provider,
        createGatewayAccount.type,
        createGatewayAccount.service_name,
        createGatewayAccount.analytics_id
      ).then(
        () => { throw new Error('Expected to reject') },
        (err) => {
          expect(err.errorCode).toBe(400)
          expect(err.message).toEqual(errorResponse)
        }
      );
    })
  })
})
