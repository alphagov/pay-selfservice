'use strict'

// NPM dependencies
const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const serviceFixtures = require('../../../../fixtures/service.fixtures')

// Global setup
chai.use(chaiAsPromised)

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const expect = chai.expect

const existingServiceExternalId = 'cp5wa'

describe('adminusers client - update service name', function () {
  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('success with en and cy', () => {
    const serviceName = {
      en: 'en-name',
      cy: 'cy-name'
    }
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequest(serviceName)
    const validUpdateServiceNameResponse = serviceFixtures.validServiceResponse({
      name: serviceName.en,
      external_id: existingServiceExternalId,
      service_name: serviceName
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update service name request with en and cy')
          .withState(`a service exists with external id ${existingServiceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceNameRequest.getPlain())
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

  describe('success with en and empty string for cy', () => {
    const serviceNameEn = 'en-name'
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequest({
      en: serviceNameEn,
      cy: ''
    })
    const validUpdateServiceNameResponse = serviceFixtures.validServiceResponse({
      name: serviceNameEn,
      external_id: existingServiceExternalId,
      service_name: {
        en: 'en-name'
      }
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update service name request with empty string for cy name')
          .withState(`a service exists with external id ${existingServiceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceNameRequest.getPlain())
          .withStatusCode(200)
          .withResponseBody(validUpdateServiceNameResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update service name with empty string for cy', function (done) {
      adminusersClient.updateServiceName(existingServiceExternalId, serviceNameEn)
        .should.be.fulfilled.then(service => {
          expect(service.external_id).to.equal(existingServiceExternalId)
          expect(service.name).to.equal(serviceNameEn)
          expect(service.service_name.en).to.equal(serviceNameEn)
        }).should.notify(done)
    })
  })

  describe('not found', () => {
    const nonExistentServiceExternalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    const serviceName = {
      en: 'en-name',
      cy: 'cy-name'
    }
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequest(serviceName)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${nonExistentServiceExternalId}`)
          .withUponReceiving('an invalid update service name request - service not found')
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceNameRequest.getPactified())
          .withStatusCode(404)
          .withResponseHeaders({})
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
