const path = require('path')
const Pact = require('pact')
const helpersPath = path.join(__dirname, '/../../test_helpers/')
const pactProxy = require(helpersPath + '/pact_proxy.js')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../app/services/clients/adminusers_client')
const serviceFixtures = require(path.join(__dirname, '/../../fixtures/service_fixtures'))
const PactInteractionBuilder = require(path.join(__dirname, '/../../fixtures/pact_interaction_builder')).PactInteractionBuilder

chai.use(chaiAsPromised)

const expect = chai.expect
const SERVICES_PATH = '/v1/api/services'
var mockPort = Math.floor(Math.random() * 65535)
var mockServer = pactProxy.create('localhost', mockPort)

var adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`})

describe('adminusers client - service users', function () {
  let adminUsersMock
  let serviceId = '12345'
  let nonExistingServiceId = '500'
  let responseParams = {service_ids: [serviceId]}
  let getServiceUsersResponse = serviceFixtures.validServiceUsersResponse([responseParams])

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-service-users', provider: 'AdminUsers', port: mockPort})
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

  describe('service user API', function () {
    context('service user - success', () => {
      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${serviceId}/users`)
            .withState('a service exists with the given id')
            .withUponReceiving('a valid get service users request')
            .withResponseBody(getServiceUsersResponse.getPactified())
            .withStatusCode(200)
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should return service users successfully', function (done) {
        adminusersClient.getServiceUsers(serviceId).should.be.fulfilled.then(
           function (users) {
             let expectedResponse = getServiceUsersResponse.getPlain()
             expect(users[0].service_ids[0]).to.be.equal(expectedResponse[0].service_ids[0])
           }
        ).should.notify(done)
      })
    })

    context('service user - failure', () => {
      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${nonExistingServiceId}/users`)
            .withState('a service doesnt exists with the given id')
            .withUponReceiving('a valid get service users request with non-existing service id')
            .withResponseBody(serviceFixtures.getServiceUsersNotFoundResponse().getPactified())
            .withStatusCode(404)
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should return service not found', function (done) {
        adminusersClient.getServiceUsers(nonExistingServiceId).should.be.rejected.then(
            function (err) {
              expect(err.errorCode).to.equal(404)
            }
         ).should.notify(done)
      })
    })
  })
})
