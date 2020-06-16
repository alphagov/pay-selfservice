'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const ledgerClient = require('../../../../app/services/clients/ledger_client')

const transactionDetailsFixtures = require('../../../fixtures/ledger_transaction_fixtures')
const legacyConnectorParityTransformer = require('../../../../app/services/clients/utils/ledger_legacy_connector_parity')
const pactTestProvider = require('./ledger_pact_test_provider')

// Constants
const TRANSACTION_SUMMARY_RESOURCE = '/v1/report/transactions-summary'
const expect = chai.expect

chai.use(chaiAsPromised)

const existingGatewayAccountId = '123456'
const defaultTransactionState = 'three payments and a refund all in success state exists'

describe('ledger client transaction summary', function () {
  before(() => pactTestProvider.setup())
  after(() => pactTestProvider.finalize())

  describe('get transaction summary', () => {
    const params = {
      account_id: existingGatewayAccountId,
      from_date: '2019-09-19T13:00:00.000Z',
      to_date: '2019-09-22T00:00:00.000Z',
      paymentCount: 2,
      paymentTotal: 3500,
      refundCount: 1,
      refundTotal: 1000
    }
    const validTransactionSummaryResponse = transactionDetailsFixtures.validTransactionSummaryDetails(params)

    before(() => {
      const pactified = validTransactionSummaryResponse.getPactified()
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_SUMMARY_RESOURCE}`)
          .withQuery('account_id', params.account_id)
          .withQuery('from_date', params.from_date)
          .withQuery('to_date', params.to_date)
          .withUponReceiving('a valid get transaction summary request')
          .withState(defaultTransactionState)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should get transaction summary successfully', function () {
      const getTransactionSummaryDetails = legacyConnectorParityTransformer.legacyConnectorTransactionSummaryParity(validTransactionSummaryResponse.getPlain())
      return ledgerClient.transactionSummary(params.account_id, params.from_date, params.to_date)
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(getTransactionSummaryDetails)
        })
    })
  })
})
