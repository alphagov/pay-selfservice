import { Pact } from '@pact-foundation/pact'
import path from 'path'
import chai from 'chai'
import userFixtures from '@test/fixtures/user.fixtures'
import Builder from '@test/test-helpers/pact/pact-interaction-builder'
import AdminUsersClient from '@services/clients/pay/AdminUsersClient.class'
import pactify from '@test/test-helpers/pact/pact-base'
import { UpdateServiceRoleRequestFixture } from '@test/fixtures/user/update-service-role-request.fixture'
import User from '@models/user/User.class'
import { AnyJson } from '@pact-foundation/pact/src/common/jsonTypes'
const { PactInteractionBuilder } = Builder

const expect = chai.expect
const USER_PATH = '/v1/api/users'
let adminUsersClient: AdminUsersClient

const existingUserExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
const existingServiceExternalId = 'cp5wa'

describe('adminusers client - update user service role', function () {
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
    adminUsersClient = new AdminUsersClient(`http://127.0.0.1:${opts.port}`)
  })
  after(() => provider.finalize())

  describe('update user service role API - success', () => {
    const role = 'view-and-refund'
    const request = new UpdateServiceRoleRequestFixture(role).toRequest()
    const userFixture = userFixtures.validUserResponse({
      external_id: existingUserExternalId,
      service_roles: [
        {
          service: { external_id: existingServiceExternalId },
          role: { name: role, description: `${role}-description` },
        },
      ],
    })

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingUserExternalId}/services/${existingServiceExternalId}`)
          .withState(`a service exists with external id ${existingServiceExternalId} with multiple admin users`)
          .withUponReceiving('a valid update service role request')
          .withMethod('PUT')
          .withRequestBody(request as unknown as AnyJson)
          .withStatusCode(200)
          .withResponseBody(pactify(userFixture))
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should update service role of a user successfully', function (done) {
      adminUsersClient.users
        .updateServiceRole(existingUserExternalId, existingServiceExternalId, request.role_name)
        .should.be.fulfilled.then(function (updatedUser: User) {
          const updatedServiceRole = updatedUser.serviceRoles.find(
            (serviceRole) => serviceRole.service.externalId === existingServiceExternalId
          )
          expect(updatedServiceRole!.role.name).to.be.equal(role)
        })
        .should.notify(done)
    })
  })

  describe('update user service role API - user not found', () => {
    const role = 'view-and-refund'
    const request = new UpdateServiceRoleRequestFixture(role).toRequest()
    const externalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // non existent external id

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${externalId}/services/${existingServiceExternalId}`)
          .withUponReceiving('an update service role request for non-existent user')
          .withMethod('PUT')
          .withRequestBody(request as unknown as AnyJson)
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should error not found for non existent user when updating service role', function (done) {
      adminUsersClient.users
        .updateServiceRole(externalId, existingServiceExternalId, request.role_name)
        .should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404)
        })
        .should.notify(done)
    })
  })

  describe('update user service role API - user does not belong to service', () => {
    const role = 'admin'
    const request = new UpdateServiceRoleRequestFixture(role).toRequest()

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingUserExternalId}/services/${existingServiceExternalId}`)
          .withState(
            `a user exists external id ${existingUserExternalId} and a service exists with external id ${existingServiceExternalId}`
          )
          .withUponReceiving('an update service role request for user that does not belong to service')
          .withMethod('PUT')
          .withRequestBody(request as unknown as AnyJson)
          .withStatusCode(409)
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should error conflict if user does not have access to the given service id', function (done) {
      adminUsersClient.users
        .updateServiceRole(existingUserExternalId, existingServiceExternalId, request.role_name)
        .should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(409)
        })
        .should.notify(done)
    })
  })

  describe('update user service role API - minimum no of admin limit reached', () => {
    const role = 'view-and-refund'
    const request = new UpdateServiceRoleRequestFixture(role).toRequest()

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingUserExternalId}/services/${existingServiceExternalId}`)
          .withState(
            `a user exists with external id ${existingUserExternalId} with admin role for service with id ${existingServiceExternalId}`
          )
          .withUponReceiving('an update service role request with minimum number of admins reached')
          .withMethod('PUT')
          .withRequestBody(request as unknown as AnyJson)
          .withStatusCode(412)
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should error precondition failed, if number of remaining admins for the service is going to be less than 1', function (done) {
      adminUsersClient.users
        .updateServiceRole(existingUserExternalId, existingServiceExternalId, request.role_name)
        .should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(412)
        })
        .should.notify(done)
    })
  })
})
