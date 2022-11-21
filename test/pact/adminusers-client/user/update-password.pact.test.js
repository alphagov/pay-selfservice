const { Pact } = require('@pact-foundation/pact')
var path = require('path')
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
var userFixtures = require('../../../fixtures/user.fixtures')
var PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder

chai.use(chaiAsPromised)

const expect = chai.expect
const RESET_PASSWORD_PATH = '/v1/api/reset-password'
var port = Math.floor(Math.random() * 48127) + 1024
var adminUsersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - update password', function () {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(async () => {
    const opts = await provider.setup()
    adminUsersClient = getAdminUsersClient({ baseUrl: `http://localhost:${opts.port}` })
  })
  after(() => provider.finalize())

  describe('update password for user API - success', () => {
    const request = userFixtures.validUpdatePasswordRequest('avalidforgottenpasswordtoken')

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(RESET_PASSWORD_PATH)
          .withState('a valid forgotten password entry and a related user exists')
          .withUponReceiving('a valid update password request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(204)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should update password successfully', function (done) {
      adminUsersClient.updatePasswordForUser(request.forgotten_password_code, request.new_password).should.be.fulfilled.notify(done)
    })
  })

  describe('update password for user API - not found', () => {
    const request = userFixtures.validUpdatePasswordRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(RESET_PASSWORD_PATH)
          .withState('a forgotten password does not exists')
          .withUponReceiving('a valid update password request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(404)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error if forgotten password code is not found/expired', function (done) {
      adminUsersClient.updatePasswordForUser(request.forgotten_password_code, request.new_password).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
