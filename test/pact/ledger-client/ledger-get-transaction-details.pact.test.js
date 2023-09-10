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
const defaultTransactionId = 'ch_123abc456xyz'

describe('ledger client', function () {
  let ledgerUrl

  before(async () => {
    const opts = await pactTestProvider.setup()
    ledgerUrl = `http://127.0.0.1:${opts.port}`
  })
  after(() => pactTestProvider.finalize())

  describe('get transaction details', () => {
    const params = {
      account_id: existingGatewayAccountId,
      transaction_id: defaultTransactionId
    }
    const validCreatedTransactionDetailsResponse = transactionDetailsFixtures.validTransactionCreatedDetailsResponse({
      transaction_id: params.transaction_id,
      type: 'payment',
      amount: 100,
      fee: 5,
      net_amount: 95,
      refund_summary_available: 100
    })
    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}/${params.transaction_id}`)
          .withQuery('account_id', params.account_id)
          .withQuery('transaction_type', 'PAYMENT')
          .withUponReceiving('a valid created transaction details request')
          .withState('a transaction with fee and net_amount exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validCreatedTransactionDetailsResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should get transaction details successfully', function () {
      const getCreatedTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionParity(validCreatedTransactionDetailsResponse)
      return ledgerClient.transaction(params.transaction_id, params.account_id, {
        baseUrl: ledgerUrl,
        transaction_type: 'PAYMENT'
      })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(getCreatedTransactionDetails)
        })
    })
  })

  describe('get transaction details with corporate card surcharge', () => {
    const params = {
      account_id: existingGatewayAccountId,
      transaction_id: defaultTransactionId
    }
    const validTransactionDetailsResponse = transactionDetailsFixtures.validTransactionCreatedDetailsResponse({
      transaction_id: params.transaction_id,
      amount: 1000,
      refund_summary_available: 1250,
      type: 'payment',
      corporate_card_surcharge: 250,
      total_amount: 1250,
      capture_submit_time: '2018-05-01T13:27:00.057Z',
      captured_date: '2018-05-01T13:27:00.057Z'
    })

    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}/${params.transaction_id}`)
          .withQuery('account_id', params.account_id)
          .withQuery('transaction_type', 'PAYMENT')
          .withUponReceiving('a valid transaction with corporate surcharge details request')
          .withState('a transaction with corporate surcharge exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validTransactionDetailsResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should get transaction with corporate card surcharge details successfully', function () {
      const getTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionParity(validTransactionDetailsResponse)
      return ledgerClient.transaction(params.transaction_id, params.account_id, {
        baseUrl: ledgerUrl,
        transaction_type: 'PAYMENT'
      })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(getTransactionDetails)
        })
    })
  })

  describe('get transaction details with metadata', () => {
    const params = {
      account_id: existingGatewayAccountId,
      transaction_id: defaultTransactionId
    }
    const validTransactionDetailsResponse = transactionDetailsFixtures.validTransactionCreatedDetailsResponse({
      transaction_id: params.transaction_id,
      amount: 1000,
      refund_summary_available: 1000,
      type: 'payment',
      metadata: {
        external_metadata: 'metadata'
      }
    })

    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}/${params.transaction_id}`)
          .withQuery('account_id', params.account_id)
          .withQuery('transaction_type', 'PAYMENT')
          .withUponReceiving('a valid transaction with metadata details request')
          .withState('a transaction with metadata exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validTransactionDetailsResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should get transaction with metadata details successfully', function () {
      const getTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionParity(validTransactionDetailsResponse)
      return ledgerClient.transaction(params.transaction_id, params.account_id, {
        baseUrl: ledgerUrl,
        transaction_type: 'PAYMENT'
      })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(getTransactionDetails)
        })
    })
  })
})
