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
const { validPaths, validOps, ServiceUpdateRequest } = require('../../../../../app/services/ServiceUpdateRequest.class')

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminUsersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingServiceExternalId = 'cp5wa'

describe('adminusers client - patch request to update service', function () {
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

  describe('a valid update service patch request to update single field', () => {
    const merchantDetailsName = 'updated-name'
    const validUpdateServiceRequest = new ServiceUpdateRequest()
      .addUpdate(validOps.replace, validPaths.merchantDetails.name, merchantDetailsName)
      .formatPayload()

    const validUpdateServiceResponse = serviceFixtures.validServiceResponse({
      external_id: existingServiceExternalId,
      merchant_details: {
        name: merchantDetailsName
      }
    })

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update single service field request')
          .withState(`a service exists with external id ${existingServiceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceRequest)
          .withStatusCode(200)
          .withResponseBody(validUpdateServiceResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update a merchant name successfully', (done) => {
      adminUsersClient.updateService(existingServiceExternalId, validUpdateServiceRequest)
        .should.be.fulfilled
        .then(service => {
          expect(service.externalId).to.equal(existingServiceExternalId)
          expect(service.merchantDetails.name).to.equal(merchantDetailsName)
        }).should.notify(done)
    })
  })

  describe('a valid update service patch request to update all fields', () => {
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

    const validUpdateServiceRequest = new ServiceUpdateRequest()
      .addUpdate(validOps.replace, validPaths.merchantDetails.name, merchantDetails.name)
      .addUpdate(validOps.replace, validPaths.merchantDetails.addressLine1, merchantDetails.address_line1)
      .addUpdate(validOps.replace, validPaths.merchantDetails.addressLine2, merchantDetails.address_line2)
      .addUpdate(validOps.replace, validPaths.merchantDetails.addressCity, merchantDetails.address_city)
      .addUpdate(validOps.replace, validPaths.merchantDetails.addressCountry, merchantDetails.address_country)
      .addUpdate(validOps.replace, validPaths.merchantDetails.addressPostcode, merchantDetails.address_postcode)
      .addUpdate(validOps.replace, validPaths.merchantDetails.telephoneNumber, merchantDetails.telephone_number)
      .addUpdate(validOps.replace, validPaths.merchantDetails.email, merchantDetails.email)
      .formatPayload()

    const validUpdateServiceResponse = serviceFixtures.validServiceResponse({
      external_id: existingServiceExternalId,
      merchant_details: merchantDetails
    })

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update service request to update all fields')
          .withState(`a service exists with external id ${existingServiceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceRequest)
          .withStatusCode(200)
          .withResponseBody(validUpdateServiceResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update service successfully', (done) => {
      adminUsersClient.updateService(existingServiceExternalId, validUpdateServiceRequest)
        .should.be.fulfilled
        .then(service => {
          expect(service.externalId).to.equal(existingServiceExternalId)
          expect(service.merchantDetails).to.deep.equal(merchantDetails)
        }).should.notify(done)
    })
  })

  describe('an invalid update service patch request', () => {
    const invalidRequest = [{
      'op': 'replace',
      'non-existent-path': 'foo',
      'value': 'bar'
    }]

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('an invalid update service patch request')
          .withState(`a service exists with external id ${existingServiceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(invalidRequest)
          .withStatusCode(400)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return a 400 response', (done) => {
      adminUsersClient.updateService(existingServiceExternalId, invalidRequest)
        .should.be.rejected
        .then(response => {
          expect(response.errorCode).to.equal(400)
        }).should.notify(done)
    })
  })
})
