'use strict'

// NPM dependencies
const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const transactionDetailsFixtures = require('../../../fixtures/transaction.fixtures')

// Constants
const CHARGES_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const gatewayAccountId = 42
const chargeId = 'abc123'
const defaultChargeState = `Gateway account ${gatewayAccountId} exists and has a charge for £1 with id ${chargeId}`

describe('connector client', function () {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('post refund', () => {
    describe('success', () => {
      const validPostRefundRequest = transactionDetailsFixtures.validTransactionRefundRequest({
        amount: 100,
        refund_amount_available: 100
      })

      before(() => {
        const pactified = validPostRefundRequest.getPactified()
        return provider.addInteraction(
          new PactInteractionBuilder(`${CHARGES_RESOURCE}/${gatewayAccountId}/charges/${chargeId}/refunds`)
            .withUponReceiving('a valid post refund request')
            .withState(defaultChargeState)
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(202)
            .build()
        )
      })

      afterEach(() => provider.verify())

      it('should post a refund request successfully', () => {
        const payload = validPostRefundRequest.getPlain()
        return connectorClient.postChargeRefund(gatewayAccountId, chargeId, payload, 'correlation-id')
          .should.be.fulfilled
      })
    })

    describe('failure', () => {
      const invalidTransactionRefundRequest = transactionDetailsFixtures.validTransactionRefundRequest({
        amount: 101,
        refund_amount_available: 100
      })
      const invalidTransactionRefundResponse = transactionDetailsFixtures.invalidTransactionRefundResponse()

      before(() => {
        const pactifiedRequest = invalidTransactionRefundRequest.getPactified()
        const pactifiedResponse = invalidTransactionRefundResponse.getPactified()

        return provider.addInteraction(
          new PactInteractionBuilder(`${CHARGES_RESOURCE}/${gatewayAccountId}/charges/${chargeId}/refunds`)
            .withUponReceiving('an invalid transaction refund request')
            .withState(defaultChargeState)
            .withMethod('POST')
            .withRequestBody(pactifiedRequest)
            .withStatusCode(400)
            .withResponseBody(pactifiedResponse)
            .build()
        )
      })

      afterEach(() => provider.verify())

      it('should fail with a refund amount greater than the refund amount available', () => {
        const refundFailureResponse = invalidTransactionRefundResponse.getPlain()
        const payload = invalidTransactionRefundRequest.getPlain()
        return connectorClient.postChargeRefund(gatewayAccountId, chargeId, payload, 'correlation-id')
          .should.be.rejected.then(response => {
            expect(response.errorCode).to.equal(400)
            expect(response.errorIdentifier).to.equal(refundFailureResponse.error_identifier)
            expect(response.reason).to.equal(refundFailureResponse.reason)
          })
      })
    })
  })
})
