'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const path = require('path')

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const stripeAccountSetupFixtures = require('../../fixtures/stripe-account-setup.fixtures')
const { pactify } = require('../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
let connectorClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = 42
const defaultState = `a stripe gateway account with external id ${existingGatewayAccountId} exists in the database`

describe('connector client - get stripe account setup', () => {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(async () => {
    const opts = await provider.setup()
    connectorClient = new Connector(`http://127.0.0.1:${opts.port}`)
  })
  after(() => provider.finalize())

  describe('get stripe account setup success', () => {
    const stripeSetupOpts = {
      bank_account: true,
      responsible_person: true,
      vat_number: false,
      company_number: false
    }
    const response = stripeAccountSetupFixtures.buildGetStripeAccountSetupResponse(stripeSetupOpts)

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/stripe-setup`)
          .withUponReceiving('a valid get stripe account bank account flag request')
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

    it('should update successfully', done => {
      connectorClient.getStripeAccountSetup(existingGatewayAccountId)
        .should.be.fulfilled
        .then(stripeAccountSetup => {
          expect(stripeAccountSetup.bankAccount).to.equal(stripeSetupOpts.bank_account)
          expect(stripeAccountSetup.vatNumber).to.equal(stripeSetupOpts.vat_number)
          expect(stripeAccountSetup.companyNumber).to.equal(stripeSetupOpts.company_number)
          expect(stripeAccountSetup.responsiblePerson).to.equal(stripeSetupOpts.responsible_person)
        }).should.notify(done)
    })
  })
})
