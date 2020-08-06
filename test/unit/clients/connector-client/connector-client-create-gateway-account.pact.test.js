'use strict'

// NPM dependencies
const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('connector client - create gateway account', function () {
  const provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('create gateway account - success', () => {
    const validCreateGatewayAccountRequest = gatewayAccountFixtures.validCreateGatewayAccountRequest()

    before((done) => {
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

    it('should submit create gateway account successfully', function (done) {
      const createGatewayAccount = validCreateGatewayAccountRequest.getPlain()
      connectorClient.createGatewayAccount(
        createGatewayAccount.payment_provider,
        createGatewayAccount.type,
        createGatewayAccount.service_name,
        createGatewayAccount.analytics_id
      ).should.be.fulfilled.should.notify(done)
    })
  })

  describe('create gateway account - bad request', () => {
    const invalidCreateGatewayAccountRequest = gatewayAccountFixtures.validCreateGatewayAccountRequest()
    const nonExistentPaymentProvider = 'non-existent-payment-provider'
    invalidCreateGatewayAccountRequest.payment_provider = nonExistentPaymentProvider
    const errorResponse = {
      message: `Unsupported payment provider ${nonExistentPaymentProvider}.`
    }

    before((done) => {
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

    it('should return 400 on missing fields', function (done) {
      const createGatewayAccount = invalidCreateGatewayAccountRequest.getPlain()
      connectorClient.createGatewayAccount(
        createGatewayAccount.payment_provider,
        createGatewayAccount.type,
        createGatewayAccount.service_name,
        createGatewayAccount.analytics_id
      ).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
        expect(response.message).to.deep.equal(errorResponse)
      }).should.notify(done)
    })
  })
})
