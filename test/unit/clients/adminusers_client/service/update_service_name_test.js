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

describe('adminusers client - update service name', function () {
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

  describe('success with en and cy', () => {
    const existingServiceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const serviceName = {
      en: 'en-name',
      cy: 'cy-name'
    }
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequestWithEnAndCy(serviceName)
    const validUpdateServiceNameResponse = serviceFixtures.validServiceResponse({
      name: serviceName.en,
      external_id: existingServiceExternalId,
      service_name: serviceName
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update service name request with en and cy')
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceNameRequest.getPactified())
          .withStatusCode(200)
          .withResponseBody(validUpdateServiceNameResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update service name for en and cy', function (done) {
      adminusersClient.updateServiceName(existingServiceExternalId, serviceName.en, serviceName.cy)
        .should.be.fulfilled.then(service => {
          expect(service.external_id).to.equal(existingServiceExternalId)
          expect(service.name).to.equal(serviceName.en)
          expect(service.service_name.en).to.equal(serviceName.en)
          expect(service.service_name.cy).to.equal(serviceName.cy)
        }).should.notify(done)
    })
  })

  describe('success with en', () => {
    const existingServiceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const serviceNameEn = 'en-name'
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequestWithEn(serviceNameEn)
    const validUpdateServiceNameResponse = serviceFixtures.validServiceResponse({
      name: serviceNameEn,
      external_id: existingServiceExternalId,
      service_name: { en: serviceNameEn }
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update service name request with en')
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceNameRequest.getPactified())
          .withStatusCode(200)
          .withResponseBody(validUpdateServiceNameResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update service name for en', function (done) {
      adminusersClient.updateServiceName(existingServiceExternalId, serviceNameEn).should.be.fulfilled.then(service => {
        expect(service.external_id).to.equal(existingServiceExternalId)
        expect(service.name).to.equal(serviceNameEn)
        expect(service.service_name.en).to.equal(serviceNameEn)
      }).should.notify(done)
    })
  })

  describe('success with cy', () => {
    const existingServiceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const serviceNameCy = 'cy-name'
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequestWithCy(serviceNameCy)
    const validUpdateServiceNameResponse = serviceFixtures.validServiceResponse({
      external_id: existingServiceExternalId,
      service_name: { cy: serviceNameCy }
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update service name request with cy')
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceNameRequest.getPactified())
          .withStatusCode(200)
          .withResponseBody(validUpdateServiceNameResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update service name for cy', function (done) {
      adminusersClient.updateServiceName(existingServiceExternalId, null, serviceNameCy).should.be.fulfilled.then(service => {
        expect(service.external_id).to.equal(existingServiceExternalId)
        expect(service.service_name.cy).to.equal(serviceNameCy)
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const nonExistentServiceExternalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    const serviceName = {
      en: 'en-name',
      cy: 'cy-name'
    }
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequestWithEnAndCy(serviceName)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${nonExistentServiceExternalId}`)
          .withUponReceiving('an invalid update service name request - service not found')
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceNameRequest.getPactified())
          .withStatusCode(404)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return not found if service not exist', function (done) {
      adminusersClient.updateServiceName(nonExistentServiceExternalId, serviceName.en, serviceName.cy).should.be.rejected.then(response => {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
