let Pact = require('pact')
let path = require('path')
let chai = require('chai')
let chaiAsPromised = require('chai-as-promised')
let getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
let userFixtures = require('../../../../fixtures/user_fixtures')
let PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder

chai.use(chaiAsPromised)

const expect = chai.expect
const USER_PATH = '/v1/api/users'
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${port}`})

describe('adminusers client - update user service role', function () {
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

  describe('update user service role API - success', () => {
    let role = 'view-and-refund'
    let request = userFixtures.validUpdateServiceRoleRequest(role)
    let userFixture = userFixtures.validUserResponse({
      service_roles: [{
        role: { name: role, description: `${role}-description` }
      }]
    })
    let user = userFixture.getPlain()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${user.external_id}/services/${user.service_roles[0].service.external_id}`)
          .withState('a user exist')
          .withUponReceiving('a valid update service role request')
          .withMethod('PUT')
          .withRequestBody(request.getPactified())
          .withStatusCode(200)
          .withResponseBody(userFixture.getPactified())
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should update service role of a user successfully', function (done) {
      let requestData = request.getPlain()
      adminusersClient.updateServiceRole(user.external_id, user.service_roles[0].service.external_id, requestData.role_name).should.be.fulfilled.then(function (updatedUser) {
        const updatedServiceRole = updatedUser.serviceRoles.find(serviceRole => serviceRole.service.externalId === user.service_roles[0].service.external_id)
        expect(updatedServiceRole.role.name).to.be.equal(role)
      }).should.notify(done)
    })
  })

  describe('update user service role API - user not found', () => {
    let role = 'view-and-refund'
    let request = userFixtures.validUpdateServiceRoleRequest(role)
    let externalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // non existent external id
    let serviceId = 1234

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${externalId}/services/${serviceId}`)
          .withState('a user with external id does not exist')
          .withUponReceiving('a valid update service role request')
          .withMethod('PUT')
          .withRequestBody(request.getPactified())
          .withStatusCode(404)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error not found for non existent user when updating service role', function (done) {
      let requestData = request.getPlain()
      adminusersClient.updateServiceRole(externalId, serviceId, requestData.role_name).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })

  describe('update user service role API - invalid role_name', () => {
    let role = 'invalid-role'
    let request = userFixtures.validUpdateServiceRoleRequest(role)
    let existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    let serviceId = 1234

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/services/${serviceId}`)
          .withState('a role with given name does not exist')
          .withUponReceiving('a valid update service role request')
          .withMethod('PUT')
          .withRequestBody(request.getPactified())
          .withStatusCode(400)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error bad request if an unknown role_name provided', function (done) {
      let requestData = request.getPlain()
      adminusersClient.updateServiceRole(existingExternalId, serviceId, requestData.role_name).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
      }).should.notify(done)
    })
  })

  describe('update user service role API - user does not belong to service', () => {
    let role = 'admin'
    let request = userFixtures.validUpdateServiceRoleRequest(role)
    let existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    let serviceId = 1234

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/services/${serviceId}`)
          .withState('a user exists with no access to service')
          .withUponReceiving('a valid update service role request')
          .withMethod('PUT')
          .withRequestBody(request.getPactified())
          .withStatusCode(409)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error conflict if user does not have access to the given service id', function (done) {
      let requestData = request.getPlain()
      adminusersClient.updateServiceRole(existingExternalId, serviceId, requestData.role_name).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(409)
      }).should.notify(done)
    })
  })

  describe('update user service role API - minimum no of admin limit reached', () => {
    let role = 'view-and-refund'
    let request = userFixtures.validUpdateServiceRoleRequest(role)
    let existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    let serviceId = 1234

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/services/${serviceId}`)
          .withState('only one user with admin role for the service')
          .withUponReceiving('a valid update service role request')
          .withMethod('PUT')
          .withRequestBody(request.getPactified())
          .withStatusCode(412)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error precondition failed, if number of remaining admins for the service is going to be less than 1', function (done) {
      let requestData = request.getPlain()
      adminusersClient.updateServiceRole(existingExternalId, serviceId, requestData.role_name).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(412)
      }).should.notify(done)
    })
  })
})
