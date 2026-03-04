import { Pact } from '@pact-foundation/pact'
import path from 'path'
import chai from 'chai'
import Builder from '@test/test-helpers/pact/pact-interaction-builder'
import AdminUsersClient from '@services/clients/pay/AdminUsersClient.class'
import { pactify } from '@test/test-helpers/pact/pactify'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import User from '@models/user/User.class'
import { AssignServiceRoleRequestFixture } from '@test/fixtures/user/assign-service-role-request.fixture'
import { ServiceRoleFixture } from '@test/fixtures/user/service-role.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { RoleFixture } from '@test/fixtures/service/role.fixture'
const { PactInteractionBuilder } = Builder

const expect = chai.expect
const USER_PATH = '/v1/api/users'
let adminUsersClient: AdminUsersClient

const existingUserExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
const existingServiceExternalId = 'cp5wa'

describe('adminusers client - assign service role to user', function () {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge',
  })

  before(async () => {
    const opts = await provider.setup()
    adminUsersClient = adminUsersClient = new AdminUsersClient(`http://127.0.0.1:${opts.port}`)
  })
  after(() => provider.finalize())

  describe('assign user service role API - success', () => {
    const role = 'view-and-refund'
    const request = new AssignServiceRoleRequestFixture({
      serviceExternalId: existingServiceExternalId,
      roleName: role,
    }).toRequest()

    const userFixture = new UserFixture({
      externalId: existingUserExternalId,
      serviceRoles: [
        new ServiceRoleFixture({
          service: new ServiceFixture({ externalId: existingServiceExternalId }),
          role: new RoleFixture({ name: role }),
        }),
      ],
    }).toUserData()

    before(async () => {
      await provider
        .addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${existingUserExternalId}/services`)
            .withUponReceiving('a valid assign service role request')
            .withState(
              `a user exists external id ${existingUserExternalId} and a service exists with external id ${existingServiceExternalId}`
            )
            .withMethod('POST')
            .withRequestBody(request)
            .withStatusCode(200)
            .withResponseBody(pactify(userFixture))
            .build()
        )
        .catch((reason) => console.log('PACT SETUP FAILED ' + reason))
    })

    afterEach(() => provider.verify())

    it('should assign service role to a user successfully', function (done) {
      adminUsersClient.users
        .assignServiceRole(existingUserExternalId, existingServiceExternalId, role)
        .should.be.fulfilled.then(function (updatedUser: User) {
          const newServiceRole = updatedUser.serviceRoles.find(
            (serviceRole) => serviceRole.service.externalId === existingServiceExternalId
          )!
          expect(newServiceRole.role.name).to.be.equal(role)
        })
        .should.notify(done)
    })
  })

  describe('update user service role API - user not found', () => {
    const role = 'view-and-refund'
    const nonExistentUserExternalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    const request = new AssignServiceRoleRequestFixture({
      serviceExternalId: existingServiceExternalId,
      roleName: role,
    }).toRequest()

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${nonExistentUserExternalId}/services`)
          .withUponReceiving('a service role request for non existent-user')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should error not found for non existent user when updating service role', function (done) {
      adminUsersClient.users
        .assignServiceRole(nonExistentUserExternalId, existingServiceExternalId, role)
        .should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404)
        })
        .should.notify(done)
    })
  })

  describe('assign user service role API - 400 response', () => {
    const role = 'admin'
    const serviceExternalId = 'XXXXXXXXXXX-invalid-id'
    const request = new AssignServiceRoleRequestFixture({
      serviceExternalId,
      roleName: role,
    }).toRequest()

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingUserExternalId}/services`)
          .withUponReceiving('an assign service role request for non existent service')
          .withState(
            `a user exists external id ${existingUserExternalId} and a service exists with external id ${existingServiceExternalId}`
          )
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(400)
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should error bad request if service cannot be located', function (done) {
      adminUsersClient.users
        .assignServiceRole(existingUserExternalId, serviceExternalId, role)
        .should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400)
        })
        .should.notify(done)
    })
  })
})
