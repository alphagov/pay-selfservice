'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const ledgerClient = require('../../../app/services/clients/ledger.client')
const transactionDetailsFixtures = require('../../fixtures/ledger-transaction.fixtures')
const legacyConnectorParityTransformer = require('../../../app/services/clients/utils/ledger-legacy-connector-parity')
const pactTestProvider = require('./ledger-pact-test-provider')
const { pactify } = require('../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const TRANSACTION_RESOURCE = '/v1/transaction'
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = '123456'

describe('ledger client', function () {
  let ledgerUrl

  before(async () => {
    const opts = await pactTestProvider.setup()
    ledgerUrl = `http://127.0.0.1:${opts.port}`
  })
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
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}`)
          .withQuery('account_id', params.account_id)
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withQuery('limit_total', 'true')
          .withQuery('limit_total_size', '5001')
          .withUponReceiving('a valid search transaction details request')
          .withState('two payments and a refund transactions exist for selfservice search')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validTransactionSearchResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should search transaction successfully', function () {
      const searchTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionsParity(validTransactionSearchResponse)
      return ledgerClient.transactions(params.account_id, {}, { baseUrl: ledgerUrl })
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
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}`)
          .withQuery('account_id', params.account_id)
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withQuery('email', params.filters.email)
          .withQuery('card_brands', params.filters.brand.join(','))
          .withQuery('limit_total', 'true')
          .withQuery('limit_total_size', '5001')
          .withUponReceiving('a valid search transaction with email and card_brands details request')
          .withState('a payment with success state exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validFilterTransactionResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should search transaction successfully', function () {
      const searchTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionsParity(validFilterTransactionResponse)
      return ledgerClient.transactions(params.account_id, params.filters, { baseUrl: ledgerUrl })
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
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}`)
          .withQuery('account_id', params.account_id)
          .withQuery('reference', params.filters.reference)
          .withQuery('from_date', fromDateTime)
          .withQuery('to_date', toDateTime)
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withQuery('payment_states', params.filters.payment_states.join(','))
          .withQuery('limit_total', 'true')
          .withQuery('limit_total_size', '5001')
          .withUponReceiving('a valid search with payment_states and partial reference transaction details request')
          .withState('a payment with success state exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validFilterTransactionResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should search transaction successfully', function () {
      const searchTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionsParity(validFilterTransactionResponse)
      return ledgerClient.transactions(params.account_id, params.filters, { baseUrl: ledgerUrl })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(searchTransactionDetails)
        })
    })
  })

  describe('search transactions with \'from_date\'', () => {
    const params = {
      account_id: existingGatewayAccountId,
      filters: {
        fromDate: '21/9/2019',
        fromTime: '01:00:00'
      }
    }

    const fromDateTime = '2019-09-21T00:00:00.000Z'

    const validTransactionSearchResponse = transactionDetailsFixtures.validTransactionSearchResponse({
      gateway_account_id: existingGatewayAccountId,
      transactions: [
        {
          amount: 1850,
          state: {
            status: 'success',
            finished: true
          },
          created_date: '2019-09-22T10:14:16.067Z',
          parent_transaction_id: '222222',
          type: 'refund',
          capture_submit_time: '2019-09-21T13:14:16.067Z',
          captured_date: '2019-09-21',
          includePaymentDetails: true
        },
        {
          amount: 2000,
          state: {
            status: 'success',
            finished: true
          },
          transaction_id: '222222',
          created_date: '2019-09-21T13:14:16.067Z',
          refund_summary_status: 'available',
          refund_summary_available: 2000,
          amount_submitted: 0,
          amount_refunded: 0,
          type: 'payment',
          card_brand: 'visa',
          email: 'j.doe@example.org',
          capture_submit_time: '2019-09-21T13:14:16.067Z',
          captured_date: '2019-09-21'
        }
      ]
    })
    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}`)
          .withQuery('account_id', params.account_id)
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withQuery('from_date', fromDateTime)
          .withQuery('limit_total', 'true')
          .withQuery('limit_total_size', '5001')
          .withUponReceiving('a valid transaction with from date filter request')
          .withState('a payment with all fields and a corresponding refund exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validTransactionSearchResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should filter transaction successfully', function () {
      const searchTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionsParity(validTransactionSearchResponse)
      return ledgerClient.transactions(params.account_id, params.filters, { baseUrl: ledgerUrl })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(searchTransactionDetails)
        })
    })
  })

  describe('search transactions with \'to_date\' with specific time', () => {
    const params = {
      account_id: existingGatewayAccountId,
      filters: {
        toDate: '21/9/2019',
        toTime: '15:00:00'
      }
    }

    const toDateTime = '2019-09-21T14:00:01.000Z'

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
          created_date: '2019-09-21T13:14:16.067Z',
          refund_summary_status: 'available',
          refund_summary_available: 2000,
          amount_submitted: 0,
          amount_refunded: 0,
          type: 'payment',
          card_brand: 'visa',
          email: 'j.doe@example.org',
          capture_submit_time: '2019-09-21T13:14:16.067Z',
          captured_date: '2019-09-21'
        }
      ]
    })
    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}`)
          .withQuery('account_id', params.account_id)
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withQuery('to_date', toDateTime)
          .withQuery('limit_total', 'true')
          .withQuery('limit_total_size', '5001')
          .withUponReceiving('a valid transaction with to date filter request')
          .withState('a payment with all fields and a corresponding refund exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validTransactionSearchResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should filter transaction successfully', function () {
      const searchTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionsParity(validTransactionSearchResponse)
      return ledgerClient.transactions(params.account_id, params.filters, { baseUrl: ledgerUrl })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(searchTransactionDetails)
        })
    })
  })

  describe('search transactions with metadata value', () => {
    const params = {
      account_id: existingGatewayAccountId,
      metadataValue: 'metadata',
      filters: {
        metadataValue: 'metadata'
      }
    }

    const validTransactionSearchResponse = transactionDetailsFixtures.validTransactionSearchResponse({
      gateway_account_id: existingGatewayAccountId,
      transactions: [
        {
          amount: 1000,
          transaction_id: 'ch_123abc456xyz',
          type: 'payment',
          metadata: {
            external_metadata: 'metadata'
          }
        }
      ]
    })

    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}`)
          .withQuery('account_id', params.account_id)
          .withQuery('metadata_value', 'metadata')
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withQuery('limit_total', 'true')
          .withQuery('limit_total_size', '5001')
          .withUponReceiving('a valid search transaction by metadata request')
          .withState('a transaction with metadata exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validTransactionSearchResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should filter transaction successfully', function () {
      const searchTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionsParity(validTransactionSearchResponse)
      return ledgerClient.transactions(params.account_id, params.filters, { baseUrl: ledgerUrl })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(searchTransactionDetails)
        })
    })
  })

  describe('search transactions by dispute_states', () => {
    const params = {
      account_id: existingGatewayAccountId,
      filters: {
        dispute_states: ['lost', 'under_review']
      }
    }

    const validFilterTransactionResponse = transactionDetailsFixtures.validTransactionSearchResponse({
      gateway_account_id: existingGatewayAccountId,
      transactions: [
        {
          amount: 2000,
          fee: 1500,
          net_amount: -3500,
          state: {
            status: 'lost',
            finished: true
          },
          created_date: '2022-07-25T11:24:32.000Z',
          transaction_id: 'duslqp12kpdfskopek230',
          parent_transaction_id: 'q5qo9mt6ajfcn2oqgaktkm2ksk',
          type: 'dispute',
          includePaymentDetails: true
        },
        {
          amount: 1000,
          state: {
            status: 'under_review',
            finished: false
          },
          created_date: '2022-07-26T11:24:32.000Z',
          transaction_id: 'du2slqp12kpdfskopek230',
          parent_transaction_id: 'dklpej3vlkn2oqgaktkm2ksk',
          type: 'dispute',
          includePaymentDetails: true
        }
      ]
    })
    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}`)
          .withQuery('account_id', params.account_id)
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withQuery('dispute_states', params.filters.dispute_states.join(','))
          .withQuery('limit_total', 'true')
          .withQuery('limit_total_size', '5001')
          .withUponReceiving('a valid search with dispute_states request')
          .withState('dispute transactions exist with states `lost` and `under_review` for selfservice search')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validFilterTransactionResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should search for dispute transactions successfully', function () {
      const searchTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionsParity(validFilterTransactionResponse)
      return ledgerClient.transactions(params.account_id, params.filters, { baseUrl: ledgerUrl })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(searchTransactionDetails)
        })
    })
  })
})
