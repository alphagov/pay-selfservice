'use strict'

// NPM dependencies
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const ledgerClient = require('../../../../app/services/clients/ledger_client')
const transactionDetailsFixtures = require('../../../fixtures/ledger_transaction_fixtures')
const legacyConnectorParityTransformer = require('../../../../app/services/clients/utils/ledger_legacy_connector_parity')
const pactTestProvider = require('./ledger_pact_test_provider')

// Constants
const TRANSACTION_RESOURCE = '/v1/transaction'
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = '123456'
const defaultTransactionState = `refund transactions exists for a gateway account`

describe('ledger client', function () {
  before(() => pactTestProvider.setup())
  after(() => pactTestProvider.finalize())

  describe('search transactions', () => {
    const params = {
      account_id: existingGatewayAccountId
    }
    const validTransactionSearchResponse = transactionDetailsFixtures.validTransactionSearchResponse({
      gateway_account_id: existingGatewayAccountId,
      transactions: [
        {
          amount: 1000,
          state: {
            status: 'success',
            finished: true
          },
          transaction_id: '111111',
          created_date: '2018-09-21T10:14:16.067Z',
          refund_summary_status: 'available',
          refund_summary_available: 950,
          amount_refunded: 50,
          capture_submit_time: '2018-09-21T10:14:18.067Z',
          captured_date: '2018-09-21T10:14:25.067Z',
          type: 'payment'
        },
        {
          amount: 2000,
          state: {
            status: 'success',
            finished: true
          },
          transaction_id: '222222',
          created_date: '2018-09-22T10:14:16.067Z',
          refund_summary_status: 'available',
          refund_summary_available: 1900,
          amount_refunded: 100,
          capture_submit_time: '2018-09-22T10:14:18.067Z',
          captured_date: '2018-09-22T10:14:25.067Z',
          type: 'payment'
        },
        {
          amount: 50,
          state: {
            status: 'success',
            finished: true
          },
          created_date: '2018-09-23T10:14:16.067Z',
          parent_transaction_id: '111111',
          type: 'refund'
        },
        {
          amount: 100,
          state: {
            status: 'success',
            finished: true
          },
          created_date: '2018-09-25T10:14:16.067Z',
          parent_transaction_id: '222222',
          type: 'refund'
        }
      ]
    })
    before(() => {
      const pactified = validTransactionSearchResponse.getPactified()
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}`)
          .withQuery('account_id', params.account_id)
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withUponReceiving('a valid search transaction details request')
          .withState(defaultTransactionState)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should search transaction successfully', function () {
      const searchTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionsParity(validTransactionSearchResponse.getPlain())
      return ledgerClient.transactions(params.account_id)
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(searchTransactionDetails)
        })
    })
  })
})
