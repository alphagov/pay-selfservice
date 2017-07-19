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

describe('adminusers client - create a new service', function () {
  let adminUsersMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-create-new-service', provider: 'adminusers', port: mockPort})
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

  describe('creating a service', function () {
    context('create a service sending an empty object - success', () => {
      const validCreateServiceResponse = serviceFixtures.validCreateServiceResponse()

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(SERVICE_RESOURCE)
            .withUponReceiving('a valid create service request with empty object')
            .withMethod('POST')
            .withRequestBody({})
            .withStatusCode(201)
            .withResponseBody(validCreateServiceResponse.getPactified())
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        )
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should create a new service', function (done) {
        adminusersClient.createService().should.be.fulfilled.then(service => {
          expect(service.external_id).to.equal('externalId')
          expect(service.name).to.equal('System Generated')
          expect(service.gateway_account_ids).to.deep.equal([])
        }).should.notify(done)
      })
    })

    context('create a service sending gateway account ids - success', () => {
      const validRequest = serviceFixtures.validCreateServiceRequest({gatewayAccountIds: ['1', '5']})
      const validCreateServiceResponse = serviceFixtures.validCreateServiceResponse(validRequest.getPlain())

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(SERVICE_RESOURCE)
            .withUponReceiving('a valid create service request with gateway account ids')
            .withMethod('POST')
            .withRequestBody(validRequest.getPactified())
            .withStatusCode(201)
            .withResponseBody(validCreateServiceResponse.getPactified())
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        )
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should create a new service', function (done) {
        adminusersClient.createService(null, validRequest.getPlain().gateway_account_ids).should.be.fulfilled.then(service => {
          expect(service.external_id).to.equal('externalId')
          expect(service.name).to.equal('System Generated')
          expect(service.gateway_account_ids).to.deep.equal(validCreateServiceResponse.getPlain().gateway_account_ids)
        }).should.notify(done)
      })
    })

    context('create a service sending service name - success', () => {
      const validRequest = serviceFixtures.validCreateServiceRequest({name: 'Service name'})
      const validCreateServiceResponse = serviceFixtures.validCreateServiceResponse(validRequest.getPlain())

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(SERVICE_RESOURCE)
            .withUponReceiving('a valid create service request with service name')
            .withMethod('POST')
            .withRequestBody(validRequest.getPactified())
            .withStatusCode(201)
            .withResponseBody(validCreateServiceResponse.getPactified())
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        )
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should create a new service', function (done) {
        adminusersClient.createService('Service name', null).should.be.fulfilled.then(service => {
          expect(service.external_id).to.equal('externalId')
          expect(service.name).to.equal('Service name')
          expect(service.gateway_account_ids).to.deep.equal([])
        }).should.notify(done)
      })
    })

    context('create a service - bad request', () => {
      const invalidRequest = serviceFixtures.validCreateServiceRequest({gateway_account_ids: ['non-numeric-id']})
      const errorResponse = serviceFixtures.badRequestResponseWhenNonNumericGatewayAccountIds(['non-numeric-id'])

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(SERVICE_RESOURCE)
            .withUponReceiving('an invalid create service request')
            .withMethod('POST')
            .withRequestBody(invalidRequest.getPactified())
            .withStatusCode(400)
            .withResponseBody(errorResponse.getPactified())
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        )
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should return 400 on invalid gateway account ids', function (done) {
        adminusersClient.createService(
          null, ['non-numeric-id']
        ).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400)
          expect(response.message.errors.length).to.equal(1)
          expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors)
        }).should.notify(done)
      })
    })
  })
})
