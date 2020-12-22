'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const path = require('path')

const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const stripeAccountFixtures = require('../../../fixtures/stripe-account.fixtures')
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = 42
const defaultState = `a stripe gateway account with external id ${existingGatewayAccountId} exists in the database`

describe('connector client - get stripe account', () => {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('get stripe account setup success', () => {
    const stripeAccountOpts = {
      stripe_account_id: 'acct_123example123'
    }
    const response = stripeAccountFixtures.buildGetStripeAccountResponse(stripeAccountOpts)

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/stripe-account`)
          .withUponReceiving('a valid get stripe account request')
          .withState(defaultState)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(response))
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get successfully', done => {
      connectorClient.getStripeAccount(existingGatewayAccountId, 'correlation-id').should.be.fulfilled.then(stripeAccount => {
        expect(stripeAccount.stripeAccountId).to.equal(stripeAccountOpts.stripe_account_id)
      }).should.notify(done)
    })
  })
})
