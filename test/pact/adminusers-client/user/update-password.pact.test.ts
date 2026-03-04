import { Pact } from '@pact-foundation/pact'
import path from 'path'
import chai from 'chai'
import userFixtures from '@test/fixtures/user.fixtures'
import Builder from '@test/test-helpers/pact/pact-interaction-builder'
import AdminUsersClient from '@services/clients/pay/AdminUsersClient.class'
import { UpdatePasswordFixture } from '@test/fixtures/user/update-password-request.fixture'
const { PactInteractionBuilder } = Builder

const expect = chai.expect
const RESET_PASSWORD_PATH = '/v1/api/reset-password'
let adminUsersClient: AdminUsersClient

describe('adminusers client - update password', function () {
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

  describe('update password for user API - success', () => {
    const request = new UpdatePasswordFixture().toRequest()

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(RESET_PASSWORD_PATH)
          .withState('a valid forgotten password entry and a related user exists')
          .withUponReceiving('a valid update password request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(204)
          .withResponseHeaders({})
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should update password successfully', function (done) {
      adminUsersClient.users
        .updatePassword(request.forgotten_password_code, request.new_password)
        .should.be.fulfilled.notify(done)
    })
  })

  describe('update password for user API - not found', () => {
    const request = userFixtures.validUpdatePasswordRequest()

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(RESET_PASSWORD_PATH)
          .withState('a forgotten password does not exists')
          .withUponReceiving('a valid update password request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(404)
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should error if forgotten password code is not found/expired', function (done) {
      adminUsersClient.users
        .updatePassword(request.forgotten_password_code, request.new_password)
        .should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404)
        })
        .should.notify(done)
    })
  })
})
