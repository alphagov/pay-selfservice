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
const TRANSACTION_SUMMARY_RESOURCE = '/v1/report/transactions-summary'
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = '123456'
const defaultTransactionState = 'three payments and a refund all in success state exists'

describe('ledger client transaction summary', function () {
  let ledgerUrl

  before(async () => {
    const opts = await pactTestProvider.setup()
    ledgerUrl = `http://127.0.0.1:${opts.port}`
  })
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
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_SUMMARY_RESOURCE}`)
          .withQuery('account_id', params.account_id)
          .withQuery('from_date', params.from_date)
          .withQuery('to_date', params.to_date)
          .withUponReceiving('a valid get transaction summary request')
          .withState(defaultTransactionState)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validTransactionSummaryResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should get transaction summary successfully', function () {
      const getTransactionSummaryDetails = legacyConnectorParityTransformer.legacyConnectorTransactionSummaryParity(validTransactionSummaryResponse)
      return ledgerClient.transactionSummary(params.account_id, params.from_date, params.to_date, { baseUrl: ledgerUrl })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(getTransactionSummaryDetails)
        })
    })
  })
})
