const { Pact } = require('@pact-foundation/pact')
var path = require('path')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
var userFixtures = require('../../../../fixtures/user.fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

const RESET_PASSWORD_PATH = '/v1/api/reset-password'
var port = Math.floor(Math.random() * 48127) + 1024
var adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - update password', () => {
  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('update password for user API - success', () => {
    let request = userFixtures.validUpdatePasswordRequest('avalidforgottenpasswordtoken')

    beforeAll((done) => {
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

    it('should update password successfully', () => {
      let requestData = request.getPlain()
      return adminusersClient.updatePasswordForUser(requestData.forgotten_password_code, requestData.new_password)
    })
  })

  describe('update password for user API - not found', () => {
    let request = userFixtures.validUpdatePasswordRequest()

    beforeAll((done) => {
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

    it(
      'should error if forgotten password code is not found/expired',
      () => {
        let requestData = request.getPlain()
        return adminusersClient.updatePasswordForUser(requestData.forgotten_password_code, requestData.new_password)
          .then(
            () => { throw new Error('Expected to reject') },
            err => expect(err.errorCode).toBe(404)
          );
      }
    )
  })
})
