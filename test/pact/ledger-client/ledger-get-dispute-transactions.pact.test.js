'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const ledgerClient = require('../../../app/services/clients/ledger.client')
const transactionDetailsFixtures = require('../../fixtures/ledger-transaction.fixtures')
const pactTestProvider = require('./ledger-pact-test-provider')
const { pactify } = require('../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const TRANSACTION_RESOURCE = '/v1/transaction'
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const paymentTransactionId = 'adb123def456'
const disputeTransactionId = 'vldb123def456'
const existingGatewayAccountId = '123456'

function defaultDisputeDetails () {
  return {
    parent_transaction_id: paymentTransactionId,
    gateway_account_id: existingGatewayAccountId,
    transactions: [
      {
        gateway_account_id: existingGatewayAccountId,
        amount: 20000,
        fee: 1500,
        net_amount: -21500,
        finished: true,
        status: 'lost',
        created_date: '2022-07-26T19:57:26.000Z',
        type: 'dispute',
        includePaymentDetails: true,
        evidence_due_date: '2022-08-04T13:59:59.000Z',
        reason: 'product_not_received',
        transaction_id: disputeTransactionId,
        parent_transaction_id: paymentTransactionId
      }
    ]
  }
}

describe('ledger client', function () {
  let ledgerUrl

  before(async () => {
    const opts = await pactTestProvider.setup()
    ledgerUrl = `http://localhost:${opts.port}`
  })
  after(() => pactTestProvider.finalize())

  describe('get dispute transactions', () => {
    const params = {
      account_id: existingGatewayAccountId,
      transaction_id: paymentTransactionId
    }
    const disputeTransactionsDetails = defaultDisputeDetails()
    const validDisputeTransactionsResponse = transactionDetailsFixtures.validDisputeTransactionsResponse(disputeTransactionsDetails)

    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}/${params.transaction_id}/transaction`)
          .withUponReceiving('a valid get dispute transactions request')
          .withQuery('gateway_account_id', params.account_id)
          .withQuery('transaction_type', 'DISPUTE')
          .withState('a dispute lost transaction exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validDisputeTransactionsResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should get transaction details successfully', function () {
      return ledgerClient.getDisputesForTransaction(params.transaction_id, params.account_id, {
        baseUrl: ledgerUrl
      })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(validDisputeTransactionsResponse)
        })
    })
  })
})
