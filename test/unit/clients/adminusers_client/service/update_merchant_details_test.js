'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
const serviceFixtures = require('../../../../fixtures/service_fixtures')

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${port}`})
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - update merchant details', function () {
  let provider = Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after((done) => provider.finalize().then(done()))

  describe('when updating merchant details with a valid request', () => {
    const existingServiceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const serviceName = 'serviceName'
    const validUpdateMerchantDetailsRequest = serviceFixtures.validUpdateMerchantDetailsRequest()
    const validUpdateMerchantDetailsResponse = serviceFixtures.validUpdateMerchantDetailsResponse({
      external_id: existingServiceExternalId,
      name: serviceName
    })
    let result

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}/merchant-details`)
          .withUponReceiving('a valid update merchant detail request')
          .withMethod('PUT')
          .withRequestBody(validUpdateMerchantDetailsRequest.getPactified())
          .withStatusCode(200)
          .withResponseBody(validUpdateMerchantDetailsResponse.getPactified())
          .build()
      )
        .then(() => adminusersClient.updateMerchantDetails(existingServiceExternalId, validUpdateMerchantDetailsRequest.getPlain()))
        .then(res => {
          result = res
          done()
        })
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should succeed', function () {
      expect(result.external_id).to.equal(existingServiceExternalId)
      expect(result.name).to.equal(serviceName)
      expect(result.merchant_details.name).to.equal(validUpdateMerchantDetailsRequest.getPlain().name)
      expect(result.merchant_details.address_line1).to.equal(validUpdateMerchantDetailsRequest.getPlain().address_line1)
      expect(result.merchant_details.address_line2).to.equal(validUpdateMerchantDetailsRequest.getPlain().address_line2)
      expect(result.merchant_details.address_city).to.equal(validUpdateMerchantDetailsRequest.getPlain().address_city)
      expect(result.merchant_details.address_country).to.equal(validUpdateMerchantDetailsRequest.getPlain().address_country)
      expect(result.merchant_details.address_postcode).to.equal(validUpdateMerchantDetailsRequest.getPlain().address_postcode)
    })
  })

  describe('when updating merchant details with an invalid request', () => {
    const existingServiceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const invalidUpdateMerchantDetailsRequest = serviceFixtures.badRequestWhenMissingMandatoryMerchantDetails()
    const invalidUpdateMerchantDetailsResponse = serviceFixtures.badResponseWhenMissingMandatoryMerchantDetails()
    let result

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}/merchant-details`)
          .withUponReceiving('an invalid update merchant detail request')
          .withMethod('PUT')
          .withRequestBody(invalidUpdateMerchantDetailsRequest.getPactified())
          .withStatusCode(400)
          .withResponseBody(invalidUpdateMerchantDetailsResponse.getPactified())
          .build()
      )
        .then(() => adminusersClient.updateMerchantDetails(existingServiceExternalId, invalidUpdateMerchantDetailsRequest.getPlain()))
        .then(() => done(new Error('Promise resolved unexpectedly')))
        .catch(err => {
          result = err
          done()
        })
    })

    afterEach(() => provider.verify())

    it('should be rejected', function () {
      expect(result.errorCode).to.equal(400)
      expect(result.message).to.deep.equal(invalidUpdateMerchantDetailsResponse.getPlain())
    })
  })
})
