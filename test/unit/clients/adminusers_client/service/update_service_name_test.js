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
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequestWithEnAndCy()
    const validUpdateServiceNameResponse = serviceFixtures.validUpdateServiceNameResponseWithEnAndCy({
      external_id: existingServiceExternalId
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
      const serviceNameEn = validUpdateServiceNameRequest.getPlain()[0].value
      const serviceNameCy = validUpdateServiceNameRequest.getPlain()[1].value
      adminusersClient.updateServiceName(existingServiceExternalId, serviceNameEn, serviceNameCy)
        .should.be.fulfilled.then(service => {
        expect(service.external_id).to.equal(existingServiceExternalId)
        expect(service.name).to.equal(serviceNameEn)
        expect(service.service_name.en).to.equal(serviceNameEn)
        expect(service.service_name.cy).to.equal(serviceNameCy)
      }).should.notify(done)
    })
  })

  describe('success with en', () => {
    const existingServiceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequestWithEn()
    const validUpdateServiceNameResponse = serviceFixtures.validUpdateServiceNameResponseWithEn({
      external_id: existingServiceExternalId
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
      const serviceNameEn = validUpdateServiceNameRequest.getPlain()[0].value
      adminusersClient.updateServiceName(existingServiceExternalId, serviceNameEn).should.be.fulfilled.then(service => {
        expect(service.external_id).to.equal(existingServiceExternalId)
        expect(service.name).to.equal(serviceNameEn)
        expect(service.service_name.en).to.equal(serviceNameEn)
      }).should.notify(done)
    })
  })

  describe('success with cy', () => {
    const existingServiceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequestWithCy()
    const validUpdateServiceNameResponse = serviceFixtures.validUpdateServiceNameResponseWithCy({
      external_id: existingServiceExternalId
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
      const serviceNameCy = validUpdateServiceNameRequest.getPlain()[0].value

      adminusersClient.updateServiceName(existingServiceExternalId, null, serviceNameCy).should.be.fulfilled.then(service => {
        expect(service.external_id).to.equal(existingServiceExternalId)
        expect(service.service_name.cy).to.equal(serviceNameCy)
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const nonExistentServiceExternalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequestWithEnAndCy()

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
      const serviceNameEn = validUpdateServiceNameRequest.getPlain()[0].value
      const serviceNameCy = validUpdateServiceNameRequest.getPlain()[1].value
      adminusersClient.updateServiceName(nonExistentServiceExternalId, serviceNameEn, serviceNameCy).should.be.rejected.then(response => {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
