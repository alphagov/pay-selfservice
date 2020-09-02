'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const ledgerClient = require('../../../../app/services/clients/ledger.client')
const transactionDetailsFixtures = require('../../../fixtures/ledger-transaction.fixtures')
const legacyConnectorParityTransformer = require('../../../../app/services/clients/utils/ledger-legacy-connector-parity')
const pactTestProvider = require('./ledger-pact-test-provider')

// Constants
const TRANSACTION_RESOURCE = '/v1/transaction'
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = '123456'
const defaultTransactionId = 'ch_123abc456xyz'
const defaultTransactionState = 'a transaction has CREATED and AUTHORISATION_REJECTED payment events'

describe('ledger client', function () {
  before(() => pactTestProvider.setup())
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
      const pactified = validTransactionEventsResponse.getPactified()
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTION_RESOURCE}/${params.transaction_id}/event`)
          .withQuery('gateway_account_id', params.account_id)
          .withUponReceiving('a valid transaction events details request')
          .withState(defaultTransactionState)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should get transaction events successfully', function () {
      const getTransactionEventsDetails = legacyConnectorParityTransformer.legacyConnectorEventsParity(validTransactionEventsResponse.getPlain())
      return ledgerClient.events(params.transaction_id, params.account_id)
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(getTransactionEventsDetails)
        })
    })
  })
})
