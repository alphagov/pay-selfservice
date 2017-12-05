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

describe('adminusers client - update service name', function () {
  let adminUsersMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-update-service-name', provider: 'adminusers', port: mockPort})
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

  describe('update service name', function () {
    context('update service name - success', () => {
      const existingServiceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
      const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequest()
      const validUpdateServiceNameResponse = serviceFixtures.validUpdateServiceNameResponse({
        external_id: existingServiceExternalId
      })

      beforeEach((done) => {
        adminUsersMock.addInteraction(
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

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should update service name', function (done) {
        adminusersClient.updateServiceName(existingServiceExternalId, validUpdateServiceNameRequest.getPlain().value).should.be.fulfilled.then(service => {
          expect(service.external_id).to.equal(existingServiceExternalId)
          expect(service.name).to.equal(validUpdateServiceNameRequest.getPlain().value)
        }).should.notify(done)
      })
    })

    context('update service name - service not found', () => {
      const nonExistentServiceExternalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequest()

      beforeEach((done) => {
        adminUsersMock.addInteraction(
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

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should return not found if service not exist', function (done) {
        adminusersClient.updateServiceName(nonExistentServiceExternalId, validUpdateServiceNameRequest.getPlain().value).should.be.rejected.then(response => {
          expect(response.errorCode).to.equal(404)
        }).should.notify(done)
      })
    })

    context('update service name - bad request', () => {
      const existingServiceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
      const invalidUpdateServiceNameRequest = serviceFixtures.badRequestWithInvalidPathWhenUpdateServiceNameRequest()

      beforeEach((done) => {
        adminUsersMock.addInteraction(
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

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should return bad request if invalid request body', function (done) {
        adminusersClient.updateServiceName(existingServiceExternalId, invalidUpdateServiceNameRequest.getPlain().value).should.be.rejected.then(response => {
          expect(response.errorCode).to.equal(400)
        }).should.notify(done)
      })
    })
  })
})
