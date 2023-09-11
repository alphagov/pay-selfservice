'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const ledgerClient = require('../../../app/services/clients/ledger.client')
const pactTestProvider = require('./ledger-pact-test-provider')
const { pactify } = require('../../test-helpers/pact/pactifier').defaultPactifier

const agreementFixtures = require('../../fixtures/agreement.fixtures')
const { validAgreementsNotFoundResponse } = require('../../fixtures/agreement.fixtures')

// Constants
const AGREEMENT_RESOURCE = '/v1/agreement'
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingServiceId = 'a-service-id'

describe('ledger client', function () {
  let ledgerUrl

  before(async () => {
    const opts = await pactTestProvider.setup()
    ledgerUrl = `http://127.0.0.1:${opts.port}`
  })
  after(() => pactTestProvider.finalize())

  describe('search agreement by reference', () => {
    const validSearchAgreementResponse = agreementFixtures.validAgreementSearchResponse([
      { reference: 'a-reference', status: 'CREATED', payment_instrument: false },
      { reference: 'a-reference', status: 'CREATED', payment_instrument: false },
      { reference: 'a-reference', status: 'ACTIVE', payment_instrument: false }
    ])

    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${AGREEMENT_RESOURCE}`)
          .withQuery('service_id', existingServiceId)
          .withQuery('live', 'false')
          .withQuery('account_id', '3456')
          .withQuery('page', '1')
          .withQuery('reference', 'a-reference')
          .withUponReceiving('a valid search agreement by reference request')
          .withState('3 agreements exist for account')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validSearchAgreementResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should search agreement by reference successfully', function () {
      return ledgerClient.agreements(existingServiceId, false, '3456', 1, { baseUrl: ledgerUrl, filters: { reference: 'a-reference' } })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(validSearchAgreementResponse)
        })
    })
  })

  describe('search agreement by status', () => {
    const validSearchAgreementResponse = agreementFixtures.validAgreementSearchResponse([{ external_id: 'agreement-3', payment_instrument: false }])

    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${AGREEMENT_RESOURCE}`)
          .withQuery('service_id', existingServiceId)
          .withQuery('live', 'false')
          .withQuery('account_id', '3456')
          .withQuery('page', '1')
          .withQuery('status', 'active')
          .withUponReceiving('a valid search agreement by status request')
          .withState('3 agreements exist for account')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validSearchAgreementResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should search agreement by status successfully', function () {
      return ledgerClient.agreements(existingServiceId, false, '3456', 1, { baseUrl: ledgerUrl, filters: { status: 'active' } })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(validSearchAgreementResponse)
        })
    })
  })

  describe('search agreement not found', () => {
    const validSearchAgreementResponse = agreementFixtures.validAgreementsNotFoundResponse()

    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${AGREEMENT_RESOURCE}`)
          .withQuery('service_id', existingServiceId)
          .withQuery('live', 'false')
          .withQuery('account_id', '3456')
          .withQuery('page', '1')
          .withQuery('reference', 'invalid-reference')
          .withUponReceiving('a valid search agreement not found request')
          .withState('3 agreements exist for account')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validSearchAgreementResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should search agreement and return none successfully', function () {
      return ledgerClient.agreements(existingServiceId, false, '3456', 1, { baseUrl: ledgerUrl, filters: { reference: 'invalid-reference' } })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(validAgreementsNotFoundResponse())
        })
    })
  })
})
