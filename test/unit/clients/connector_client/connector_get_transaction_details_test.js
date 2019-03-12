'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector_client').ConnectorClient
const transactionDetailsFixtures = require('../../../fixtures/transaction_fixtures')

// Constants
const CHARGES_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = 42
const defaultChargeId = 'abc123'
const defaultChargeState = `Gateway account ${existingGatewayAccountId} exists and has a charge for £1 with id ${defaultChargeId}`

describe('connector client', function () {
  const provider = Pact({
    consumer: 'selfservice-to-be',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after((done) => provider.finalize().then(() => { done() }))

  describe('get transaction details', () => {
    const params = {
      gatewayAccountId: existingGatewayAccountId,
      chargeId: defaultChargeId
    }
    const validGetTransactionDetailsResponse = transactionDetailsFixtures.validTransactionDetailsResponse({
      charge_id: params.chargeId
    })

    before((done) => {
      const pactified = validGetTransactionDetailsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${CHARGES_RESOURCE}/${params.gatewayAccountId}/charges/${params.chargeId}`)
          .withUponReceiving('a valid transaction details request')
          .withState(defaultChargeState)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get transaction details successfully', function (done) {
      const getTransactionDetails = validGetTransactionDetailsResponse.getPlain()
      connectorClient.getCharge(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getTransactionDetails)
          done()
        })
    })
  })

  describe('get transaction details with corporate card surcharge', () => {
    const params = {
      gatewayAccountId: existingGatewayAccountId,
      chargeId: 'charge-with-corporate-charge'
    }
    const validGetTransactionDetailsResponse = transactionDetailsFixtures.validTransactionDetailsResponse({
      charge_id: params.chargeId,
      corporate_card_surcharge: 250,
      total_amount: 1250
    })

    before((done) => {
      const pactified = validGetTransactionDetailsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${CHARGES_RESOURCE}/${params.gatewayAccountId}/charges/${params.chargeId}`)
          .withUponReceiving('a valid transaction details request with corporate card surcharge')
          .withState(`Gateway account ${params.gatewayAccountId} exists and has a charge with id ${params.chargeId} which has a corporate card surcharge`)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get transaction details successfully', function (done) {
      const getTransactionDetails = validGetTransactionDetailsResponse.getPlain()
      connectorClient.getCharge(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getTransactionDetails)
          done()
        })
    })
  })

  describe('get charge events', () => {
    const params = {
      gatewayAccountId: existingGatewayAccountId,
      chargeId: defaultChargeId
    }
    const validGetChargeEventsResponse = transactionDetailsFixtures.validChargeEventsResponse({
      events: [
        {
          state: { status: 'started' }
        },
        {
          state: { status: 'failed' }
        }
      ]
    })

    before((done) => {
      const pactified = validGetChargeEventsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${CHARGES_RESOURCE}/${params.gatewayAccountId}/charges/${params.chargeId}/events`)
          .withUponReceiving('a valid charge events request')
          .withState(defaultChargeState)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get charge events successfully', function (done) {
      const getChargeEvents = validGetChargeEventsResponse.getPlain()
      connectorClient.getChargeEvents(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getChargeEvents)
          done()
        })
    })
  })

  describe('post refund', () => {
    describe('success', () => {
      const validPostRefundRequest = transactionDetailsFixtures.validTransactionRefundRequest({
        amount: 100,
        refund_amount_available: 100
      })

      const params = {
        gatewayAccountId: existingGatewayAccountId,
        chargeId: defaultChargeId,
        payload: validPostRefundRequest.getPlain()
      }
      before((done) => {
        const pactified = validPostRefundRequest.getPactified()
        provider.addInteraction(
          new PactInteractionBuilder(`${CHARGES_RESOURCE}/${params.gatewayAccountId}/charges/${params.chargeId}/refunds`)
            .withUponReceiving('a valid post refund request')
            .withState(defaultChargeState)
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(202)
            .build()
        )
          .then(() => done())
          .catch(done)
      })

      afterEach(() => provider.verify())

      it('should post a refund request successfully', function (done) {
        connectorClient.postChargeRefund(
          params, () => {
            done()
          }
        )
      })
    })

    describe('failure', () => {
      const invalidTransactionRefundRequest = transactionDetailsFixtures.validTransactionRefundRequest({
        amount: 101,
        refund_amount_available: 100
      })
      const invalidTransactionRefundResponse = transactionDetailsFixtures.invalidTransactionRefundResponse()

      const params = {
        gatewayAccountId: 42,
        chargeId: 'refund-success',
        payload: invalidTransactionRefundRequest.getPlain()
      }

      before((done) => {
        const pactifiedRequest = invalidTransactionRefundRequest.getPactified()
        const pactifiedResponse = invalidTransactionRefundResponse.getPactified()

        provider.addInteraction(
          new PactInteractionBuilder(`${CHARGES_RESOURCE}/${params.gatewayAccountId}/charges/${params.chargeId}/refunds`)
            .withUponReceiving('an invalid transaction refund request')
            .withState(defaultChargeState)
            .withMethod('POST')
            .withRequestBody(pactifiedRequest)
            .withStatusCode(400)
            .withResponseBody(pactifiedResponse)
            .build()
        ).then(() => done())
          .catch(done)
      })

      afterEach(() => provider.verify())

      it('should fail with a refund amount greater than the refund amount available', function (done) {
        const refundFailureResponse = invalidTransactionRefundResponse.getPlain()
        connectorClient.postChargeRefund(params,
          () => {
            done('refund success callback should not be executed')
          }).on('connectorError', (err, response) => {
          if (err) { return done(err) }
          expect(response.statusCode).to.equal(400)
          expect(response.body).to.deep.equal(refundFailureResponse)
          done()
        })
      })
    })
  })
})
