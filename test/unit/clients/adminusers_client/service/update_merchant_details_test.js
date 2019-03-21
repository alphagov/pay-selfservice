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
const adminUsersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingServiceExternalId = 'cp5wa'

describe('adminusers client - patch request to update details', function () {
  let provider = Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(done => provider.finalize().then(done()))

  describe('a valid update merchant details patch request to update only the name', () => {
    const merchantDetails = { name: 'updated-merchant-details-name' }
    const validUpdateMerchantNameRequest = serviceFixtures.validUpdateMerchantDetailsRequest(merchantDetails)
    const validUpdateMerchantNameResponse = serviceFixtures.validServiceResponse({
      external_id: existingServiceExternalId,
      merchant_details: merchantDetails
    })

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update merchant name request')
          .withState(`a service exists with external id ${existingServiceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdateMerchantNameRequest.getPlain())
          .withStatusCode(200)
          .withResponseBody(validUpdateMerchantNameResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update a merchant name successfully', (done) => {
      adminUsersClient.updateMerchantDetails(existingServiceExternalId, merchantDetails)
        .should.be.fulfilled
        .then(service => {
          expect(service.externalId).to.equal(existingServiceExternalId)
          expect(service.merchantDetails.name).to.equal(merchantDetails.name)
        }).should.notify(done)
    })
  })

  describe('a valid update merchant details patch request to update all fields', () => {
    const merchantDetails = {
      name: 'new-name',
      address_line1: 'new-line1',
      address_line2: 'new-line2',
      address_city: 'new-city',
      address_postcode: 'E1 8QS',
      address_country: 'GB',
      telephone_number: '07700 900 982',
      email: 'foo@example.com'
    }
    const validUpdateMerchantDetailsRequest = serviceFixtures.validUpdateMerchantDetailsRequest(merchantDetails)
    const validUpdateMerchantDetailsResponse = serviceFixtures.validServiceResponse({
      external_id: existingServiceExternalId,
      merchant_details: merchantDetails
    })

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update merchant details request to update all fields')
          .withState(`a service exists with external id ${existingServiceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdateMerchantDetailsRequest.getPlain())
          .withStatusCode(200)
          .withResponseBody(validUpdateMerchantDetailsResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update a merchant details successfully', (done) => {
      adminUsersClient.updateMerchantDetails(existingServiceExternalId, merchantDetails)
        .should.be.fulfilled
        .then(service => {
          expect(service.externalId).to.equal(existingServiceExternalId)
          expect(service.merchantDetails).to.deep.equal(merchantDetails)
        }).should.notify(done)
    })
  })

  describe('an invalid update merchant details patch request', () => {
    const merchantDetails = { 'non-existent-path': 'foo' }
    const invalidRequest = serviceFixtures.validUpdateMerchantDetailsRequest(merchantDetails)

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('an invalid update merchant details request')
          .withState(`a service exists with external id ${existingServiceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(invalidRequest.getPlain())
          .withStatusCode(400)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return a 400 response', (done) => {
      adminUsersClient.updateMerchantDetails(existingServiceExternalId, merchantDetails)
        .should.be.rejected
        .then(response => {
          expect(response.errorCode).to.equal(400)
        }).should.notify(done)
    })
  })
})
