'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
let connectorClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('connector client - create gateway account', function () {
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

  describe('create gateway account - success', () => {
    const validCreateGatewayAccountRequest = gatewayAccountFixtures.validCreateGatewayAccountRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(ACCOUNTS_RESOURCE)
          .withUponReceiving('a valid create gateway account request')
          .withMethod('POST')
          .withRequestBody(validCreateGatewayAccountRequest)
          .withStatusCode(201)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should submit create gateway account successfully', function (done) {
      connectorClient.createGatewayAccount(
        validCreateGatewayAccountRequest.payment_provider,
        validCreateGatewayAccountRequest.type,
        validCreateGatewayAccountRequest.service_name,
        validCreateGatewayAccountRequest.analytics_id,
        validCreateGatewayAccountRequest.service_id
      ).should.be.fulfilled.should.notify(done)
    })
  })

  describe('create gateway account - invalid request', () => {
    const invalidCreateGatewayAccountRequest = gatewayAccountFixtures.validCreateGatewayAccountRequest()
    invalidCreateGatewayAccountRequest.payment_provider = 'non-existent-payment-provider'
    const errorResponse = {
      message: ['Unsupported payment provider value.']
    }

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(ACCOUNTS_RESOURCE)
          .withUponReceiving('an invalid create gateway account request')
          .withMethod('POST')
          .withRequestBody(invalidCreateGatewayAccountRequest)
          .withStatusCode(422)
          .withResponseBody(errorResponse)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return 422 for unsupported payment provider', function (done) {
      connectorClient.createGatewayAccount(
        invalidCreateGatewayAccountRequest.payment_provider,
        invalidCreateGatewayAccountRequest.type,
        invalidCreateGatewayAccountRequest.service_name,
        invalidCreateGatewayAccountRequest.analytics_id,
        invalidCreateGatewayAccountRequest.service_id
      ).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(422)
        expect(response.message).to.equal(errorResponse.message[0])
      }).should.notify(done)
    })
  })
})
