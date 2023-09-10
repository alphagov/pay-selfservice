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
const defaultTransactionState = 'a transaction has CREATED and AUTHORISATION_REJECTED payment events'

describe('ledger client', function () {
  let ledgerUrl

  before(async () => {
    const opts = await pactTestProvider.setup()
    ledgerUrl = `http://127.0.0.1:${opts.port}`
  })
  after(() => pactTestProvider.finalize())

  describe('get transaction events details', () => {
    const params = {
      account_id: existingGatewayAccountId,
      transaction_id: defaultTransactionId
    }
    const validTransactionEventsResponse = transactionDetailsFixtures.validTransactionEventsResponse({
      transaction_id: params.transaction_id,
      payment_states: [
        {
          status: 'created',
          timestamp: '2019-08-06T10:34:43.487123Z',
          event_type: 'PAYMENT_CREATED',
          amount: 21170
        },
        {
          status: 'declined',
          timestamp: '2019-08-06T10:34:48.123456Z',
          event_type: 'AUTHORISATION_REJECTED',
          amount: 21170
        }
      ]
    })
    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}/${params.transaction_id}/event`)
          .withQuery('gateway_account_id', params.account_id)
          .withUponReceiving('a valid transaction events details request')
          .withState(defaultTransactionState)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validTransactionEventsResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should get transaction events successfully', function () {
      const getTransactionEventsDetails = legacyConnectorParityTransformer.legacyConnectorEventsParity(validTransactionEventsResponse)
      return ledgerClient.events(params.transaction_id, params.account_id, { baseUrl: ledgerUrl })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(getTransactionEventsDetails)
        })
    })
  })
})
