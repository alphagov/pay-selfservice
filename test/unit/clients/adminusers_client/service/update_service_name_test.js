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
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after((done) => provider.finalize().then(done()))

  describe('success', () => {
    const existingServiceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequest()
    const validUpdateServiceNameResponse = serviceFixtures.validUpdateServiceNameResponse({
      external_id: existingServiceExternalId
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update service name request')
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

    it('should update service name', function (done) {
      adminusersClient.updateServiceName(existingServiceExternalId, validUpdateServiceNameRequest.getPlain().value).should.be.fulfilled.then(service => {
        expect(service.external_id).to.equal(existingServiceExternalId)
        expect(service.name).to.equal(validUpdateServiceNameRequest.getPlain().value)
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const nonExistentServiceExternalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequest()

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
      adminusersClient.updateServiceName(nonExistentServiceExternalId, validUpdateServiceNameRequest.getPlain().value).should.be.rejected.then(response => {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })

  describe('bad request', () => {
    const existingServiceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const invalidUpdateServiceNameRequest = serviceFixtures.badRequestWithInvalidPathWhenUpdateServiceNameRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('an invalid update service name request - bad request')
          .withMethod('PATCH')
          .withRequestBody(invalidUpdateServiceNameRequest.getPactified())
          .withStatusCode(400)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return bad request if invalid request body', function (done) {
      adminusersClient.updateServiceName(existingServiceExternalId, invalidUpdateServiceNameRequest.getPlain().value).should.be.rejected.then(response => {
        expect(response.errorCode).to.equal(400)
      }).should.notify(done)
    })
  })
})
