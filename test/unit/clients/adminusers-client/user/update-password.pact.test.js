const { Pact } = require('@pact-foundation/pact')
var path = require('path')
const { expect } = require('chai')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
var userFixtures = require('../../../../fixtures/user.fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder


const RESET_PASSWORD_PATH = '/v1/api/reset-password'
var port = Math.floor(Math.random() * 48127) + 1024
var adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - update password', function () {
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

  describe('update password for user API - success', () => {
    let request = userFixtures.validUpdatePasswordRequest('avalidforgottenpasswordtoken')

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(RESET_PASSWORD_PATH)
          .withState('a valid forgotten password entry and a related user exists')
          .withUponReceiving('a valid update password request')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(204)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should update password successfully', function () {
      let requestData = request.getPlain()
      return adminusersClient.updatePasswordForUser(requestData.forgotten_password_code, requestData.new_password)
    })
  })

  describe('update password for user API - not found', () => {
    let request = userFixtures.validUpdatePasswordRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(RESET_PASSWORD_PATH)
          .withState('a forgotten password does not exists')
          .withUponReceiving('a valid update password request')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(404)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error if forgotten password code is not found/expired', function () {
      let requestData = request.getPlain()
      return adminusersClient.updatePasswordForUser(requestData.forgotten_password_code, requestData.new_password)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).to.equal(404)
        )
    })
  })
})
