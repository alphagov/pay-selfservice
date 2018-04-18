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
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${port}`})

describe('adminusers client - assign service role to user', function () {
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

  describe('assign user service role API - success', () => {
    let role = 'view-and-refund'
    let userExternalId = 'existing-user'
    let serviceExternalId = 'random-service-id'
    let request = userFixtures.validAssignServiceRoleRequest(serviceExternalId, role)
    let userFixture = userFixtures.validUser({
      external_id: userExternalId,
      service_roles: [{
        service: {
          name: 'new service',
          external_id: serviceExternalId,
          gateway_account_ids: ['2']
        },
        role: {
          name: role,
          description: `${role}-description`,
          permissions: [{name: 'perm-1'}]
        }
      }]
    })

    let userResponse = userFixture.getPlain()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${userExternalId}/services`)
          .withState('a user exist')
          .withUponReceiving('a valid assign service role request')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(200)
          .withResponseBody(userFixtures.validUserResponse(userResponse).getPactified())
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should assign service role to a user successfully', function (done) {
      adminusersClient.assignServiceRole(userExternalId, serviceExternalId, role).should.be.fulfilled.then(function (updatedUser) {
        const newServiceRole = updatedUser.serviceRoles.find(serviceRole => serviceRole.service.externalId === serviceExternalId)
        expect(newServiceRole.service.name).to.be.equal('new service')
        expect(newServiceRole.role.name).to.be.equal(role)
      }).should.notify(done)
    })
  })

  describe('update user service role API - user not found', () => {
    let role = 'view-and-refund'
    let externalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // non existent external id
    const serviceExternalId = 'valid-service-id'
    let request = userFixtures.validAssignServiceRoleRequest(serviceExternalId, role)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${externalId}/services`)
          .withState('a user with external id does not exist')
          .withUponReceiving('a valid assign service role request')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(404)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error not found for non existent user when updating service role', function (done) {
      adminusersClient.assignServiceRole(externalId, serviceExternalId, role).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })

  describe('assign user service role API - invalid role_name', () => {
    let role = 'invalid-role'
    let existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    let serviceExternalId = 'valid-service-external-id'
    let request = userFixtures.validAssignServiceRoleRequest(serviceExternalId, role)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/services`)
          .withState('a role with given name does not exist')
          .withUponReceiving('a valid assign service role request')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(400)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error bad request if an unknown role_name provided', function (done) {
      adminusersClient.assignServiceRole(existingExternalId, serviceExternalId, role).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
      }).should.notify(done)
    })
  })

  describe('assign user service role API - invalid service id', () => {
    let role = 'admin'
    let existingExternalId = 'valid-user-id'
    let serviceExternalId = 'XXXXXXXXXXX-invalid-id'
    let request = userFixtures.validAssignServiceRoleRequest(serviceExternalId, role)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/services`)
          .withState('a service with given external id does not exist')
          .withUponReceiving('a valid assign service role request')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(400)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error bad request if service cannot be located', function (done) {
      adminusersClient.assignServiceRole(existingExternalId, serviceExternalId, role).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
      }).should.notify(done)
    })
  })
})
