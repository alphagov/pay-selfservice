'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const ledgerClient = require('../../../../app/services/clients/ledger_client')
const transactionDetailsFixtures = require('../../../fixtures/ledger_transaction_fixtures')
const legacyConnectorParityTransformer = require('../../../../app/services/clients/utils/ledger_legacy_connector_parity')
const pactTestProvider = require('./ledger_pact_test_provider')

// Constants
const TRANSACTION_RESOURCE = '/v1/transaction'
const expect = chai.expect

chai.use(chaiAsPromised)

const existingGatewayAccountId = '123456'
const defaultTransactionId = 'ch_123abc456xyz'

describe('ledger client', function () {
  before(() => pactTestProvider.setup())
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
      const pactified = validCreatedTransactionDetailsResponse.getPactified()
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}/${params.transaction_id}`)
          .withQuery('account_id', params.account_id)
          .withQuery('transaction_type', 'PAYMENT')
          .withUponReceiving('a valid created transaction details request')
          .withState('a transaction with fee and net_amount exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should get transaction details successfully', function () {
      const getCreatedTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionParity(validCreatedTransactionDetailsResponse.getPlain())
      return ledgerClient.transaction(params.transaction_id, params.account_id, { transaction_type: 'PAYMENT' })
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
      const pactified = validTransactionDetailsResponse.getPactified()
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}/${params.transaction_id}`)
          .withQuery('account_id', params.account_id)
          .withQuery('transaction_type', 'PAYMENT')
          .withUponReceiving('a valid transaction with corporate surcharge details request')
          .withState('a transaction with corporate surcharge exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should get transaction with corporate card surcharge details successfully', function () {
      const getTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionParity(validTransactionDetailsResponse.getPlain())
      return ledgerClient.transaction(params.transaction_id, params.account_id, { transaction_type: 'PAYMENT' })
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
      const pactified = validTransactionDetailsResponse.getPactified()
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}/${params.transaction_id}`)
          .withQuery('account_id', params.account_id)
          .withQuery('transaction_type', 'PAYMENT')
          .withUponReceiving('a valid transaction with metadata details request')
          .withState('a transaction with metadata exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should get transaction with metadata details successfully', function () {
      const getTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionParity(validTransactionDetailsResponse.getPlain())
      return ledgerClient.transaction(params.transaction_id, params.account_id, { transaction_type: 'PAYMENT' })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(getTransactionDetails)
        })
    })
  })
})
