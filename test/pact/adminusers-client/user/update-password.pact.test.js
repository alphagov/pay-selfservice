const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const userFixtures = require('../../../fixtures/user.fixtures')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const AdminUsersClient = require('@services/clients/pay/AdminUsersClient.class')

chai.use(chaiAsPromised)

const expect = chai.expect
const RESET_PASSWORD_PATH = '/v1/api/reset-password'
let adminUsersClient

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
    const request = userFixtures.validUpdatePasswordRequest('avalidforgottenpasswordtoken')

    before((done) => {
      provider
        .addInteraction(
          new PactInteractionBuilder(RESET_PASSWORD_PATH)
            .withState('a valid forgotten password entry and a related user exists')
            .withUponReceiving('a valid update password request')
            .withMethod('POST')
            .withRequestBody(request)
            .withStatusCode(204)
            .withResponseHeaders({})
            .build()
        )
        .then(() => done())
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

    before((done) => {
      provider
        .addInteraction(
          new PactInteractionBuilder(RESET_PASSWORD_PATH)
            .withState('a forgotten password does not exists')
            .withUponReceiving('a valid update password request')
            .withMethod('POST')
            .withRequestBody(request)
            .withStatusCode(404)
            .build()
        )
        .then(() => done())
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
