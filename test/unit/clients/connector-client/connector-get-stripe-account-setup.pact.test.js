'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')

const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const stripeAccountSetupFixtures = require('../../../fixtures/stripe-account-setup.fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)

// Global setup

const existingGatewayAccountId = 42
const defaultState = `a stripe gateway account with external id ${existingGatewayAccountId} exists in the database`

describe('connector client - get stripe account setup', () => {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('get stripe account setup success', () => {
    const stripeSetupOpts = {
      bank_account: true,
      responsible_person: true,
      vat_number: false,
      company_number: false
    }
    const response = stripeAccountSetupFixtures.buildGetStripeAccountSetupResponse(stripeSetupOpts)

    beforeAll(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/stripe-setup`)
          .withUponReceiving('a valid get stripe account bank account flag request')
          .withState(defaultState)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(response.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', () => {
      return connectorClient.getStripeAccountSetup(existingGatewayAccountId)
        .then(stripeAccountSetup => {
          expect(stripeAccountSetup.bankAccount).toBe(stripeSetupOpts.bank_account)
          expect(stripeAccountSetup.vatNumber).toBe(stripeSetupOpts.vat_number)
          expect(stripeAccountSetup.companyNumber).toBe(stripeSetupOpts.company_number)
          expect(stripeAccountSetup.responsiblePerson).toBe(stripeSetupOpts.responsible_person)
        });
    })
  })
})
