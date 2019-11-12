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

describe('ledger client', function () {
  before(() => pactTestProvider.setup())
  after(() => pactTestProvider.finalize())

  describe('search transactions with no filters', () => {
    const params = {
      account_id: existingGatewayAccountId
    }
    const validTransactionSearchResponse = transactionDetailsFixtures.validTransactionSearchResponse({
      gateway_account_id: existingGatewayAccountId,
      transactions: [
        {
          amount: 2000,
          state: {
            status: 'success',
            finished: true
          },
          transaction_id: '222222',
          created_date: '2018-09-22T10:14:15.067Z',
          refund_summary_status: 'available',
          refund_summary_available: 1850,
          amount_submitted: 150,
          type: 'payment',
          card_brand: 'visa'
        },
        {
          amount: 1000,
          state: {
            status: 'started',
            finished: false
          },
          transaction_id: '111111',
          created_date: '2018-09-21T10:14:16.067Z',
          refund_summary_status: 'available',
          refund_summary_available: 1000,
          type: 'payment'
        },
        {
          amount: 150,
          state: {
            status: 'success',
            finished: true
          },
          created_date: '2018-09-26T10:14:16.067Z',
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
          .withQuery('with_parent_transaction', 'true')
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withUponReceiving('a valid search transaction details request')
          .withState('two payments and a refund transactions exist for selfservice search')
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

  describe('filter transactions with multiple values for \'card_brand\' and a value for \'email\'', () => {
    const params = {
      account_id: existingGatewayAccountId,
      filters: {
        brand: ['visa', 'mastercard'],
        email: 'doe'
      }
    }
    const validFilterTransactionResponse = transactionDetailsFixtures.validTransactionSearchResponse({
      gateway_account_id: existingGatewayAccountId,
      transactions: [
        {
          amount: 2000,
          state: {
            status: 'success',
            finished: true
          },
          transaction_id: '222222',
          created_date: '2018-09-22T10:14:15.067Z',
          refund_summary_status: 'available',
          refund_summary_available: 1850,
          amount_submitted: 150,
          type: 'payment',
          card_brand: 'visa',
          email: 'j.doe@example.org',
          capture_submit_time: '2018-09-22T10:15:15.067Z',
          captured_date: '2018-09-22'
        }
      ]
    })
    before(() => {
      const pactified = validFilterTransactionResponse.getPactified()
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}`)
          .withQuery('account_id', params.account_id)
          .withQuery('with_parent_transaction', 'true')
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withQuery('email', params.filters.email)
          .withQuery('card_brands', params.filters.brand.join(','))
          .withUponReceiving('a valid search transaction with email and card_brands details request')
          .withState('a payment with success state exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should search transaction successfully', function () {
      const searchTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionsParity(validFilterTransactionResponse.getPlain())
      return ledgerClient.transactions(params.account_id, params.filters)
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(searchTransactionDetails)
        })
    })
  })

  describe('get filtered transactions with multiple values for \'payment_states\', a partial value for \'reference\' and a to/from date defined', () => {
    const params = {
      account_id: existingGatewayAccountId,
      filters: {
        payment_states: ['created', 'started', 'submitted', 'success'],
        reference: 'pay',
        fromDate: '01/5/2019',
        fromTime: '01:00:00',
        toDate: '05/10/2019',
        toTime: '01:00:00'
      }
    }

    const fromDateTime = '2019-05-01T00:00:00.000Z'
    const toDateTime = '2019-10-05T00:00:01.000Z'

    const validFilterTransactionResponse = transactionDetailsFixtures.validTransactionSearchResponse({
      gateway_account_id: existingGatewayAccountId,
      transactions: [
        {
          amount: 2000,
          state: {
            status: 'success',
            finished: true
          },
          reference: 'payment1',
          transaction_id: '222222',
          created_date: '2018-09-22T10:14:15.067Z',
          refund_summary_status: 'available',
          refund_summary_available: 1850,
          amount_submitted: 150,
          type: 'payment',
          card_brand: 'visa',
          email: 'j.doe@example.org',
          capture_submit_time: '2018-09-22T10:15:15.067Z',
          captured_date: '2018-09-22'
        }
      ]
    })
    before(() => {
      const pactified = validFilterTransactionResponse.getPactified()
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}`)
          .withQuery('account_id', params.account_id)
          .withQuery('with_parent_transaction', 'true')
          .withQuery('reference', params.filters.reference)
          .withQuery('from_date', fromDateTime)
          .withQuery('to_date', toDateTime)
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withQuery('payment_states', params.filters.payment_states.join(','))
          .withUponReceiving('a valid search with payment_states and partial reference transaction details request')
          .withState('a payment with success state exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should search transaction successfully', function () {
      const searchTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionsParity(validFilterTransactionResponse.getPlain())
      return ledgerClient.transactions(params.account_id, params.filters)
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(searchTransactionDetails)
        })
    })
  })
})
