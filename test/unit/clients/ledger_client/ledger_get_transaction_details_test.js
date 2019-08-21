'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const ledgerClient = require('../../../../app/services/clients/ledger_client')
const transactionDetailsFixtures = require('../../../fixtures/ledger_transaction_fixtures')
const legacyConnectorParityTransformer = require('../../../../app/services/clients/utils/ledger_legacy_connector_parity')

// Constants
const TRANSACTION_RESOURCE = '/v1/transaction'
const expect = chai.expect
const port = 8006

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = '123456'
const defaultTransactionId = 'ch_123abc456xyz'
const defaultTransactionState = `a transaction with fee and net_amount exists`

describe('ledger client', function () {
  const provider = Pact({
    consumer: 'selfservice',
    provider: 'ledger',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('get transaction details', () => {
    const params = {
      account_id: existingGatewayAccountId,
      transaction_id: defaultTransactionId
    }
    const validCreatedTransactionDetailsResponse = transactionDetailsFixtures.validTransactionCreatedDetailsResponse({
      transaction_id: params.transaction_id,
      amount: 100,
      fee: 5,
      net_amount: 95,
      refund_summary_available: 100
    })
    before(() => {
      const pactified = validCreatedTransactionDetailsResponse.getPactified()
      return provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}/${params.transaction_id}`)
          .withQuery('account_id', params.account_id)
          .withQuery('transaction_type', 'PAYMENT')
          .withUponReceiving('a valid created transaction details request')
          .withState(defaultTransactionState)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should get transaction details successfully', function () {
      const getCreatedTransactionDetails = legacyConnectorParityTransformer.legacyConnectorTransactionParity(validCreatedTransactionDetailsResponse.getPlain())
      return ledgerClient.transaction(params.transaction_id, params.account_id, { transaction_type: 'PAYMENT' })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(getCreatedTransactionDetails)
        })
    })
  })
})
