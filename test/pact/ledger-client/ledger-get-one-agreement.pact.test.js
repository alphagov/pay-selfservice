'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const ledgerClient = require('../../../app/services/clients/ledger.client')
const pactTestProvider = require('./ledger-pact-test-provider')
const { pactify } = require('../../test-helpers/pact/pactifier').defaultPactifier

const agreementFixtures = require('../../fixtures/agreement.fixtures')

// Constants
const AGREEMENT_RESOURCE = '/v1/agreement'
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingServiceId = 'a-service-id'
const existingAgreementId = 'agreement1234567'

describe('ledger client', function () {
  let ledgerUrl

  before(async () => {
    const opts = await pactTestProvider.setup()
    ledgerUrl = `http://localhost:${opts.port}`
  })
  after(() => pactTestProvider.finalize())

  describe('get one agreement', () => {
    const params = {
      service_id: existingServiceId,
      external_id: existingAgreementId
    }
    const validGetOneAgreementResponse = agreementFixtures.validAgreementResponse(params)

    before(() => {
      return pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${AGREEMENT_RESOURCE}/${existingAgreementId}`)
          .withQuery('service_id', existingServiceId)
          .withUponReceiving('a valid get agreement request')
          .withState('an agreement with payment instrument exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validGetOneAgreementResponse))
          .build()
      )
    })

    afterEach(() => pactTestProvider.verify())

    it('should get one agreement successfully', function () {
      return ledgerClient.agreement(existingAgreementId, existingServiceId, { baseUrl: ledgerUrl })
        .then((ledgerResponse) => {
          expect(ledgerResponse).to.deep.equal(validGetOneAgreementResponse)
        })
    })
  })

  describe('not found', () => {
    const nonExistentAgreementExternalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

    before(done => {
      pactTestProvider.addInteraction(
        new PactInteractionBuilder(`${AGREEMENT_RESOURCE}/${nonExistentAgreementExternalId}`)
          .withQuery('service_id', existingServiceId)
          .withUponReceiving('a valid get agreement request with non-existing agreement id')
          .withState('an agreement with payment instrument exists')
          .withStatusCode(404)
          .withResponseBody(pactify(agreementFixtures.validAgreementNotFoundResponse()))
          .build()
      ).then(() => done())
    })

    afterEach(() => pactTestProvider.verify())

    it('should return not found if agreement not exist', function (done) {
      ledgerClient.agreement(nonExistentAgreementExternalId, existingServiceId, { baseUrl: ledgerUrl })
        .should.be.rejected
        .then(
          err => {
            expect(err.errorCode).to.equal(404)
          }
        ).should.notify(done)
    })
  })
})
