'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const path = require('path')

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const stripeAccountSetupFixtures = require('../../fixtures/stripe-account-setup.fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
let connectorClient

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = 42
const defaultState = `a stripe gateway account with external id ${existingGatewayAccountId} exists in the database`

describe('connector client - set stripe account setup flag', () => {
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

  describe('set bank account flag', () => {
    const request = stripeAccountSetupFixtures.buildUpdateBankAccountDetailsFlagRequest(true)

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/stripe-setup`)
          .withUponReceiving('a valid patch update stripe account bank account flag request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', done => {
      connectorClient.setStripeAccountSetupFlag(existingGatewayAccountId, 'bank_account')
        .should.be.fulfilled
        .notify(done)
    })
  })

  describe('set vat number flag', () => {
    const request = stripeAccountSetupFixtures.buildUpdateVatNumberFlagRequest(true)

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/stripe-setup`)
          .withUponReceiving('a valid patch update stripe account vat number flag request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', done => {
      connectorClient.setStripeAccountSetupFlag(existingGatewayAccountId, 'vat_number')
        .should.be.fulfilled
        .notify(done)
    })
  })

  describe('set company number flag', () => {
    const request = stripeAccountSetupFixtures.buildUpdateCompanyNumberFlagRequest(true)

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/stripe-setup`)
          .withUponReceiving('a valid patch update stripe account company number flag request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', done => {
      connectorClient.setStripeAccountSetupFlag(existingGatewayAccountId, 'company_number')
        .should.be.fulfilled
        .notify(done)
    })
  })

  describe('set responsible person flag', () => {
    const request = stripeAccountSetupFixtures.buildUpdateResponsiblePersonFlagRequest(true)

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/stripe-setup`)
          .withUponReceiving('a valid patch update stripe account responsible person flag request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', done => {
      connectorClient.setStripeAccountSetupFlag(existingGatewayAccountId, 'responsible_person')
        .should.be.fulfilled
        .notify(done)
    })
  })

  describe('set director flag', () => {
    const request = stripeAccountSetupFixtures.buildUpdateDirectorRequest(true)

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/stripe-setup`)
          .withUponReceiving('a valid patch update stripe account director flag request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', done => {
      connectorClient.setStripeAccountSetupFlag(existingGatewayAccountId, 'director')
        .should.be.fulfilled
        .notify(done)
    })
  })

  describe('set government_entity_document flag', () => {
    const request = stripeAccountSetupFixtures.buildGovernmentEntityDocumentRequest(true)

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/stripe-setup`)
          .withUponReceiving('a valid patch update stripe account government_entity_document flag request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', done => {
      connectorClient.setStripeAccountSetupFlag(existingGatewayAccountId, 'government_entity_document')
        .should.be.fulfilled
        .notify(done)
    })
  })
})
