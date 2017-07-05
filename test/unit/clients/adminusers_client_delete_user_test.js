const path = require('path')
const Pact = require('pact')
const helpersPath = path.join(__dirname, '/../../test_helpers/')
const pactProxy = require(helpersPath + '/pact_proxy.js')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../app/services/clients/adminusers_client')
const PactInteractionBuilder = require(path.join(__dirname, '/../../fixtures/pact_interaction_builder')).PactInteractionBuilder
const SERVICES_PATH = '/v1/api/services'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`})
const expect = chai.expect

chai.use(chaiAsPromised)

describe('adminusers client - delete user', function () {
  let adminUsersMock
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-delete-user', provider: 'adminusers', port: mockPort})
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

  describe('delete user API', function () {
    const serviceId = 'pact-delete-service-id'
    const removerId = 'pact-delete-remover-id'
    const userId = 'pact-delete-user-id'

    context('delete user API - success', () => {
      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${serviceId}/users/${userId}`)
            .withState('a user and user admin exists in service with the given ids before a delete operation')
            .withUponReceiving('a valid delete user from service request')
            .withMethod('DELETE')
            .withRequestHeaders({
              'Accept': 'application/json',
              'GovUkPay-User-Context': removerId
            })
            .withResponseHeaders({})
            .withStatusCode(204)
            .build())
          .then(() => done())
          .catch(e => console.log(e))
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should delete a user successfully', function (done) {
        adminusersClient.deleteUser(serviceId, removerId, userId).should.be.fulfilled
          .then(() => {
          })
          .should.notify(done)
      })
    })

    context('delete user API - remove user itself - conflict', () => {
      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${serviceId}/users/${removerId}`)
            .withUponReceiving('a valid delete user from service request but remover is equal to user to be removed')
            .withMethod('DELETE')
            .withRequestHeaders({
              'Accept': 'application/json',
              'GovUkPay-User-Context': removerId
            })
            .withResponseHeaders({})
            .withStatusCode(409)
            .build())
          .then(() => done())
          .catch(e => console.log(e))
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should conflict when remover and user to delete coincide', function (done) {
        adminusersClient.deleteUser(serviceId, removerId, removerId).should.be.rejected
          .then((response) => {
            expect(response.errorCode).to.equal(409)
          })
          .should.notify(done)
      })
    })

    context('delete user API - user does not exist - not found', () => {
      const otherUserId = 'user-does-not-exist'

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${serviceId}/users/${otherUserId}`)
            .withUponReceiving('an invalid delete user from service request as user does not exist')
            .withMethod('DELETE')
            .withRequestHeaders({
              'Accept': 'application/json',
              'GovUkPay-User-Context': removerId
            })
            .withResponseHeaders({})
            .withStatusCode(404)
            .build())
          .then(() => done())
          .catch(e => console.log(e))
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should return not found when resource is not found (user or service)', function (done) {
        adminusersClient.deleteUser(serviceId, removerId, otherUserId).should.be.rejected
          .then((response) => {
            expect(response.errorCode).to.equal(404)
          })
          .should.notify(done)
      })
    })

    context('delete user API - user context (remover) does not exist - forbidden', () => {
      const nonExistentRemoverId = 'user-does-not-exist'
      const serviceId = 'pact-service-no-remover-test'
      const userId = 'pact-user-no-remover-test'

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${serviceId}/users/${userId}`)
            .withState('a user exists but not the remover before a delete operation')
            .withUponReceiving('a non existent user context')
            .withMethod('DELETE')
            .withRequestHeaders({
              'Accept': 'application/json',
              'GovUkPay-User-Context': nonExistentRemoverId
            })
            .withResponseHeaders({})
            .withStatusCode(403)
            .build())
          .then(() => done())
          .catch(e => console.log(e))
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should return forbidden when remover dos not ex', function (done) {
        adminusersClient.deleteUser(serviceId, nonExistentRemoverId, userId).should.be.rejected
          .then((response) => {
            expect(response.errorCode).to.equal(403)
          })
          .should.notify(done)
      })
    })
  })
})
