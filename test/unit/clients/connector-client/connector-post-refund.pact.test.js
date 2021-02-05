'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const transactionDetailsFixtures = require('../../../fixtures/refund.fixtures')
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const CHARGES_RESOURCE = '/v1/api/accounts'
let connectorClient
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

  describe('post refund', () => {
    describe('success', () => {
      const validPostRefundRequest = transactionDetailsFixtures.validTransactionRefundRequest({
        amount: 100,
        refund_amount_available: 100
      })

      before(() => {
        return provider.addInteraction(
          new PactInteractionBuilder(`${CHARGES_RESOURCE}/${gatewayAccountId}/charges/${chargeId}/refunds`)
            .withUponReceiving('a valid post refund request')
            .withState(defaultChargeState)
            .withMethod('POST')
            .withRequestBody(validPostRefundRequest)
            .withStatusCode(202)
            .build()
        )
      })

      afterEach(() => provider.verify())

      it('should post a refund request successfully', () => {
        return connectorClient.postChargeRefund(gatewayAccountId, chargeId, validPostRefundRequest, 'correlation-id')
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
        return provider.addInteraction(
          new PactInteractionBuilder(`${CHARGES_RESOURCE}/${gatewayAccountId}/charges/${chargeId}/refunds`)
            .withUponReceiving('an invalid transaction refund request')
            .withState(defaultChargeState)
            .withMethod('POST')
            .withRequestBody(invalidTransactionRefundRequest)
            .withStatusCode(400)
            .withResponseBody(pactify(invalidTransactionRefundResponse))
            .build()
        )
      })

      afterEach(() => provider.verify())

      it('should fail with a refund amount greater than the refund amount available', () => {
        return connectorClient.postChargeRefund(gatewayAccountId, chargeId, invalidTransactionRefundRequest, 'correlation-id')
          .should.be.rejected.then(response => {
            expect(response.errorCode).to.equal(400)
            expect(response.errorIdentifier).to.equal(invalidTransactionRefundResponse.error_identifier)
            expect(response.reason).to.equal(invalidTransactionRefundResponse.reason)
          })
      })
    })
  })
})
