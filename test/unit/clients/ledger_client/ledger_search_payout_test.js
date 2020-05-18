'use strict'

const chai = require('chai')

const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const ledgerClient = require('../../../../app/services/clients/ledger_client')
const payoutFixture = require('../../../fixtures/payout_fixtures')
const pactTestProvider = require('./ledger_pact_test_provider')

const { expect } = chai

const GATEWAY_ACCOUNT_ID = 1

describe('ledger client', () => {
  before(() => pactTestProvider.setup())
  after(() => pactTestProvider.finalize())

  describe('search payouts utility wrapper', () => {
    const response = payoutFixture.validPayoutSearchResponse({
      gateway_account_id: GATEWAY_ACCOUNT_ID
    })

    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder('/v1/payout')
          .withQuery('gateway_account_id', GATEWAY_ACCOUNT_ID)
          .withQuery('page', '1')
          .withQuery('display_size', '100')
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
      const ledgerResult = await ledgerClient.payouts(GATEWAY_ACCOUNT_ID, 1)
      expect(ledgerResult).to.deep.equal(response.getPlain())
    })
  })
})
