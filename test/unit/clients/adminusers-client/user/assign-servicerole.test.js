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
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

const existingUserExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
const existingServiceExternalId = 'cp5wa'

describe('adminusers client - assign service role to user', function () {
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

  describe('assign user service role API - success', () => {
    const role = 'view-and-refund'
    const request = userFixtures.validAssignServiceRoleRequest({
      service_external_id: existingServiceExternalId,
      role_name: role
    })
    const userFixture = userFixtures.validUserResponse({
      external_id: existingUserExternalId,
      service_roles: [{
        service: {
          external_id: existingServiceExternalId
        },
        role: {
          name: role,
          description: `${role}-description`,
          permissions: [{ name: 'perm-1' }]
        }
      }],
      provisional_otp_key: null
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingUserExternalId}/services`)
          .withUponReceiving('a valid assign service role request')
          .withState(`a user exists external id ${existingUserExternalId} and a service exists with external id ${existingServiceExternalId}`)
          .withMethod('POST')
          .withRequestBody(request.getPlain())
          .withStatusCode(200)
          .withResponseBody(userFixture.getPactified())
          .build()
      ).then(() => done())
        .catch(reason => console.log('PACT SETUP FAILED ' + reason))
    })

    afterEach(() => provider.verify())

    it('should assign service role to a user successfully', function (done) {
      adminusersClient.assignServiceRole(existingUserExternalId, existingServiceExternalId, role).should.be.fulfilled.then(function (updatedUser) {
        const newServiceRole = updatedUser.serviceRoles.find(serviceRole => serviceRole.service.externalId === existingServiceExternalId)
        expect(newServiceRole.role.name).to.be.equal(role)
      }).should.notify(done)
    })
  })

  describe('update user service role API - user not found', () => {
    const role = 'view-and-refund'
    const nonExistentUserExternalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    const request = userFixtures.validAssignServiceRoleRequest({
      service_external_id: existingServiceExternalId,
      role_name: role
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${nonExistentUserExternalId}/services`)
          .withUponReceiving('a service role request for non existent-user')
          .withMethod('POST')
          .withRequestBody(request.getPlain())
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error not found for non existent user when updating service role', function (done) {
      adminusersClient.assignServiceRole(nonExistentUserExternalId, existingServiceExternalId, role).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })

  describe('assign user service role API - 400 response', () => {
    let role = 'admin'
    let serviceExternalId = 'XXXXXXXXXXX-invalid-id'
    const request = userFixtures.validAssignServiceRoleRequest({
      service_external_id: serviceExternalId,
      role_name: role
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingUserExternalId}/services`)
          .withUponReceiving('an assign service role request for non existent service')
          .withState(`a user exists external id ${existingUserExternalId} and a service exists with external id ${existingServiceExternalId}`)
          .withMethod('POST')
          .withRequestBody(request.getPlain())
          .withStatusCode(400)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error bad request if service cannot be located', function (done) {
      adminusersClient.assignServiceRole(existingUserExternalId, serviceExternalId, role).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
      }).should.notify(done)
    })
  })
})
