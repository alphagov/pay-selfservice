const path = require('path')
const Pact = require('pact')
const helpersPath = path.join(__dirname, '/../../test_helpers/')
const pactProxy = require(helpersPath + '/pact_proxy.js')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../app/services/clients/adminusers_client')
const userFixtures = require(path.join(__dirname, '/../../fixtures/user_fixtures'))
const PactInteractionBuilder = require(path.join(__dirname, '/../../fixtures/pact_interaction_builder')).PactInteractionBuilder

chai.use(chaiAsPromised)

const expect = chai.expect
const USER_PATH = '/v1/api/users'
let mockPort = Math.floor(Math.random() * 40000) + 1024
let mockServer = pactProxy.create('localhost', mockPort)

let adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`})

describe('adminusers client - update user service role', function () {
  let adminUsersMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-update-service-role', provider: 'AdminUsers', port: mockPort})
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

  describe('update user service role API', function () {
    context('update user service role API - success', () => {
      let role = 'view-and-refund'
      let request = userFixtures.validUpdateServiceRoleRequest(role)
      let userFixture = userFixtures.validUser({role: {name: role, description: `${role}-description`}})
      let user = userFixture.getPlain()

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${user.externalId}/services/${user.service_ids[0]}`)
            .withState('a user exist')
            .withUponReceiving('a valid update service role request')
            .withMethod('PUT')
            .withRequestBody(request.getPactified())
            .withStatusCode(200)
            .withResponseBody(userFixtures.validUserResponse(user).getPactified())
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should update service role of a user successfully', function (done) {
        let requestData = request.getPlain()
        adminusersClient.updateServiceRole(user.externalId, user.service_ids[0], requestData.role_name).should.be.fulfilled.then(function (updatedUser) {
          expect(updatedUser.role.name).to.be.equal(role)
        }).should.notify(done)
      })
    })

    context('update user service role API - user not found', () => {
      let role = 'view-and-refund'
      let request = userFixtures.validUpdateServiceRoleRequest(role)
      let externalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // non existent external id
      let serviceId = 1234

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${externalId}/services/${serviceId}`)
            .withState('a user with external id does not exist')
            .withUponReceiving('a valid update service role request')
            .withMethod('PUT')
            .withRequestBody(request.getPactified())
            .withStatusCode(404)
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should error not found for non existent user when updating service role', function (done) {
        let requestData = request.getPlain()
        adminusersClient.updateServiceRole(externalId, serviceId, requestData.role_name).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404)
        }).should.notify(done)
      })
    })

    context('update user service role API - invalid role_name', () => {
      let role = 'invalid-role'
      let request = userFixtures.validUpdateServiceRoleRequest(role)
      let existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
      let serviceId = 1234

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/services/${serviceId}`)
            .withState('a role with given name does not exist')
            .withUponReceiving('a valid update service role request')
            .withMethod('PUT')
            .withRequestBody(request.getPactified())
            .withStatusCode(400)
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should error bad request if an unknown role_name provided', function (done) {
        let requestData = request.getPlain()
        adminusersClient.updateServiceRole(existingExternalId, serviceId, requestData.role_name).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400)
        }).should.notify(done)
      })
    })

    context('update user service role API - user does not belong to service', () => {
      let role = 'admin'
      let request = userFixtures.validUpdateServiceRoleRequest(role)
      let existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
      let serviceId = 1234

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/services/${serviceId}`)
            .withState('a user exists with no access to service')
            .withUponReceiving('a valid update service role request')
            .withMethod('PUT')
            .withRequestBody(request.getPactified())
            .withStatusCode(409)
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should error conflict if user does not have access to the given service id', function (done) {
        let requestData = request.getPlain()
        adminusersClient.updateServiceRole(existingExternalId, serviceId, requestData.role_name).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(409)
        }).should.notify(done)
      })
    })

    context('update user service role API - minimum no of admin limit reached', () => {
      let role = 'view-and-refund'
      let request = userFixtures.validUpdateServiceRoleRequest(role)
      let existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
      let serviceId = 1234

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/services/${serviceId}`)
            .withState('only one user with admin role for the service')
            .withUponReceiving('a valid update service role request')
            .withMethod('PUT')
            .withRequestBody(request.getPactified())
            .withStatusCode(412)
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should error precondition failed, if number of remaining admins for the service is going to be less than 1', function (done) {
        let requestData = request.getPlain()
        adminusersClient.updateServiceRole(existingExternalId, serviceId, requestData.role_name).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(412)
        }).should.notify(done)
      })
    })
  })
})
