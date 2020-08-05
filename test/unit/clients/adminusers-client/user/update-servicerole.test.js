const { Pact } = require('@pact-foundation/pact')
let path = require('path')
let chai = require('chai')
let chaiAsPromised = require('chai-as-promised')
let getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
let userFixtures = require('../../../../fixtures/user.fixtures')
let PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

chai.use(chaiAsPromised)

const expect = chai.expect
const USER_PATH = '/v1/api/users'
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

const existingUserExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
const existingServiceExternalId = 'cp5wa'

describe('adminusers client - update user service role', function () {
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

  describe('update user service role API - success', () => {
    let role = 'view-and-refund'
    let request = userFixtures.validUpdateServiceRoleRequest(role)
    let userFixture = userFixtures.validUserResponse({
      external_id: existingUserExternalId,
      service_roles: [{
        service: { external_id: existingServiceExternalId },
        role: { name: role, description: `${role}-description` }
      }]
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingUserExternalId}/services/${existingServiceExternalId}`)
          .withState(`a service exists with external id ${existingServiceExternalId} with multiple admin users`)
          .withUponReceiving('a valid update service role request')
          .withMethod('PUT')
          .withRequestBody(request.getPlain())
          .withStatusCode(200)
          .withResponseBody(userFixture.getPactified())
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should update service role of a user successfully', function (done) {
      let requestData = request.getPlain()
      adminusersClient.updateServiceRole(existingUserExternalId, existingServiceExternalId, requestData.role_name).should.be.fulfilled.then(function (updatedUser) {
        const updatedServiceRole = updatedUser.serviceRoles.find(serviceRole => serviceRole.service.externalId === existingServiceExternalId)
        expect(updatedServiceRole.role.name).to.be.equal(role)
      }).should.notify(done)
    })
  })

  describe('update user service role API - user not found', () => {
    let role = 'view-and-refund'
    let request = userFixtures.validUpdateServiceRoleRequest(role)
    let externalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // non existent external id

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${externalId}/services/${existingServiceExternalId}`)
          .withUponReceiving('an update service role request for non-existent user')
          .withMethod('PUT')
          .withRequestBody(request.getPlain())
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error not found for non existent user when updating service role', function (done) {
      let requestData = request.getPlain()
      adminusersClient.updateServiceRole(externalId, existingServiceExternalId, requestData.role_name).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })

  describe('update user service role API - user does not belong to service', () => {
    let role = 'admin'
    let request = userFixtures.validUpdateServiceRoleRequest(role)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingUserExternalId}/services/${existingServiceExternalId}`)
          .withState(`a user exists external id ${existingUserExternalId} and a service exists with external id ${existingServiceExternalId}`)
          .withUponReceiving('an update service role request for user that does not belong to service')
          .withMethod('PUT')
          .withRequestBody(request.getPlain())
          .withStatusCode(409)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error conflict if user does not have access to the given service id', function (done) {
      let requestData = request.getPlain()
      adminusersClient.updateServiceRole(existingUserExternalId, existingServiceExternalId, requestData.role_name).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(409)
      }).should.notify(done)
    })
  })

  describe('update user service role API - minimum no of admin limit reached', () => {
    let role = 'view-and-refund'
    let request = userFixtures.validUpdateServiceRoleRequest(role)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingUserExternalId}/services/${existingServiceExternalId}`)
          .withState(`a user exists with external id ${existingUserExternalId} with admin role for service with id ${existingServiceExternalId}`)
          .withUponReceiving('an update service role request with minimum number of admins reached')
          .withMethod('PUT')
          .withRequestBody(request.getPlain())
          .withStatusCode(412)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error precondition failed, if number of remaining admins for the service is going to be less than 1', function (done) {
      let requestData = request.getPlain()
      adminusersClient.updateServiceRole(existingUserExternalId, existingServiceExternalId, requestData.role_name).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(412)
      }).should.notify(done)
    })
  })
})
