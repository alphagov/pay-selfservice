import { Pact } from '@pact-foundation/pact'
import path from 'path'
import chai from 'chai'
import Builder from '@test/test-helpers/pact/pact-interaction-builder'
import AdminUsersClient from '@services/clients/pay/AdminUsersClient.class'
import { pactify } from '@test/test-helpers/pact/pactify'
import { UserFixture } from '@test/fixtures/user/user.fixture'
const { PactInteractionBuilder } = Builder
// constants
let adminUsersClient: AdminUsersClient
const USER_PATH = '/v1/api/users'

const expect = chai.expect

describe('adminusers client - get user', () => {
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

  describe('find a valid user', () => {
    const existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const getUserResponse = new UserFixture({ externalId: existingExternalId }).toUserData()

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}`)
          .withState(`a user exists with the given external id ${existingExternalId}`)
          .withUponReceiving('a valid get user request')
          .withResponseBody(pactify(getUserResponse))
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should find a user successfully', (done) => {
      adminUsersClient.users
        .findByExternalId(getUserResponse.external_id)
        .should.be.fulfilled.then((user) => {
          expect(user.externalId).to.be.equal(getUserResponse.external_id)
          expect(user.email).to.be.equal(getUserResponse.email)
          expect(user.serviceRoles.length).to.be.equal(1)
          expect(user.serviceRoles[0].service.gatewayAccountIds.length).to.be.equal(1)
          expect(user.telephoneNumber).to.be.equal(getUserResponse.telephone_number)
          expect(user.otpKey).to.be.equal(getUserResponse.otp_key)
          expect(user.provisionalOtpKey).to.be.equal(getUserResponse.provisional_otp_key)
          expect(user.secondFactor).to.be.equal(getUserResponse.second_factor)
          expect(user.serviceRoles[0].role.permissions.length).to.be.equal(
            getUserResponse.service_roles[0].role.permissions.length
          )
        })
        .should.notify(done)
    })
  })

  describe('user not found', () => {
    const params = {
      external_id: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // non existent external id
    }

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${params.external_id}`)
          .withState('no user exists with the given external id')
          .withUponReceiving('a valid get user request of an non existing user')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should respond 404 if user not found', (done) => {
      adminUsersClient.users
        .findByExternalId(params.external_id)
        .should.be.rejected.then((response) => {
          expect(response.errorCode).to.equal(404)
        })
        .should.notify(done)
    })
  })
})
