'use strict'

const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const payoutFixture = require('../../../fixtures/payout.fixtures')
const ledgerClient = require('../../../../app/services/clients/ledger.client')

const pactTestProvider = require('./ledger-pact-test-provider')

const GATEWAY_ACCOUNT_ID = '654321'

describe('ledger client', () => {
  beforeAll(() => pactTestProvider.setup())
  afterAll(() => pactTestProvider.finalize())

  describe('search payouts', () => {
    const payoutOpts = [{
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      gatewayPayoutId: 'payout-id-2',
      createdDate: '2020-05-22T12:22:16.067Z',
      paidoutDate: '2020-05-23T14:22:16.067Z',
      amount: 2345
    }, {
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      gatewayPayoutId: 'payout-id-1',
      createdDate: '2020-05-21T12:22:16.067Z',
      paidoutDate: '2020-05-22T14:22:16.067Z',
      amount: 1250
    }]
    const response = payoutFixture.validPayoutSearchResponse(payoutOpts)

    beforeAll(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder('/v1/payout')
          .withQuery('gateway_account_id', GATEWAY_ACCOUNT_ID)
          .withQuery('state', 'paidout')
          .withQuery('page', '1')
          .withUponReceiving('a valid search payout details request')
          .withState('two payouts exist for selfservice search')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(response.getPactified())
          .build()
      )
    })
    afterEach(() => pactTestProvider.verify())

    it('should search payouts successfully', async () => {
      const ledgerResult = await ledgerClient.payouts([ GATEWAY_ACCOUNT_ID ], 1)
      expect(ledgerResult).toEqual(response.getPlain())
    })
  })
})
