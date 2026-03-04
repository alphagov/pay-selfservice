import { Pact } from '@pact-foundation/pact'
import path from 'path'
import chai from 'chai'
import Builder from '@test/test-helpers/pact/pact-interaction-builder'
import AdminUsersClient from '@services/clients/pay/AdminUsersClient.class'
import { pactify } from '@test/test-helpers/pact/pactify'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import random from '@utils/random'
import { ServiceRoleFixture } from '@test/fixtures/user/service-role.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import User from '@models/user/User.class'
const { PactInteractionBuilder } = Builder
// constants
let adminUsersClient: AdminUsersClient

const expect = chai.expect

const USER_PATH = '/v1/api/users'

const serviceRoleFixture = new ServiceRoleFixture({ service: new ServiceFixture({ gatewayAccountIds: ['666', '7'] }) })

describe('adminusers client - get users', function () {
  const provider = new Pact({
    consumer: 'selfservice-to-be',
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

  describe('success', () => {
    const existingExternalIds = [random.randomUuid(), random.randomUuid()]

    const expectedUsers = existingExternalIds.map((externalId) =>
      new UserFixture({ externalId, serviceRoles: [serviceRoleFixture] }).toUserData()
    )

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(USER_PATH)
          .withQuery('ids', existingExternalIds.join())
          .withState('the given external id all refer to existing users')
          .withUponReceiving('a valid get users request')
          .withResponseBody(pactify(expectedUsers))
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should find users successfully', function () {
      const result = expect(adminUsersClient.users.findMultipleByExternalIds(existingExternalIds))

      return result.to.be.fulfilled.then(function (users: User[]) {
        users.forEach((user, index) => {
          expect(user.externalId).to.be.equal(expectedUsers[index].external_id)
          expect(user.email).to.be.equal(expectedUsers[index].email)
          expect(user.serviceRoles.length).to.be.equal(1)
          expect(user.serviceRoles[0].service.gatewayAccountIds.length).to.be.equal(2)
          expect(user.telephoneNumber).to.be.equal(expectedUsers[index].telephone_number)
          expect(user.otpKey).to.be.equal(expectedUsers[index].otp_key)
          expect(user.serviceRoles[0].role.permissions.length).to.be.equal(
            expectedUsers[index].service_roles[0].role.permissions.length
          )
        })
      })
    })
  })

  describe('not found', () => {
    const existingExternalIds = [random.randomUuid(), random.randomUuid()]

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(USER_PATH)
          .withQuery('ids', existingExternalIds.join())
          .withState('no users exits with the given external id')
          .withUponReceiving('a valid get users request of an non existing user')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should respond 404 if user not found', function () {
      return expect(adminUsersClient.users.findMultipleByExternalIds(existingExternalIds)).to.be.rejected.then(
        function (response) {
          expect(response.errorCode).to.equal(404)
        }
      )
    })
  })
})
