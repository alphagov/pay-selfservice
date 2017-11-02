'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const pactProxy = require('../../../../test_helpers/pact_proxy')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
const serviceFixtures = require('../../../../fixtures/service_fixtures')

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`})
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - update merchant details', function () {
  let adminUsersMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-update-merchant-details', provider: 'adminusers', port: mockPort})
      done()
    })
  })

  /**
   * Remove the server and publish pacts to broker
   */
  after(function (done) {
    mockServer.delete()
      .then(() => pactProxy.removeAll())
      .then(() => done())
  })

  describe('when updating merchant details with a valid request', function () {
    const existingServiceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const serviceName = 'serviceName'
    const validUpdateMerchantDetailsRequest = serviceFixtures.validUpdateMerchantDetailsRequest()
    const validUpdateMerchantDetailsResponse = serviceFixtures.validUpdateMerchantDetailsResponse({
      external_id: existingServiceExternalId,
      name: serviceName
    })
    let result

    before((done) => {
      adminUsersMock.addInteraction(
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

    after((done) => {
      adminUsersMock.finalize().then(() => done())
    })

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

  describe('when updating merchant details with an invalid request', function () {
    const existingServiceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const invalidUpdateMerchantDetailsRequest = serviceFixtures.badRequestWhenMissingMandatoryMerchantDetails()
    const invalidUpdateMerchantDetailsResponse = serviceFixtures.badResponseWhenMissingMandatoryMerchantDetails()
    let result

    before((done) => {
      adminUsersMock.addInteraction(
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

    after((done) => {
      adminUsersMock.finalize().then(() => done())
    })

    it('should be rejected', function () {
      expect(result.errorCode).to.equal(400)
      expect(result.message).to.deep.equal(invalidUpdateMerchantDetailsResponse.getPlain())
    })
  })
})
