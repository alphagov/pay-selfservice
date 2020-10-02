const { Pact } = require('@pact-foundation/pact')
var path = require('path')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
var userFixtures = require('../../../../fixtures/user.fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const FORGOTTEN_PASSWORD_PATH = '/v1/api/forgotten-passwords'

describe('adminusers client - get forgotten password', () => {
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

  describe('success', () => {
    let code = 'existing-code'
    let validForgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ code: code })
    let expectedForgottenPassword = validForgottenPasswordResponse.getPlain()

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${FORGOTTEN_PASSWORD_PATH}/${code}`)
          .withState('a forgotten password entry exist')
          .withUponReceiving('forgotten password get request')
          .withResponseBody(validForgottenPasswordResponse.getPactified())
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should GET a forgotten password entry', () => {
      return adminusersClient.getForgottenPassword(code).then(function (forgottenPassword) {
        expect(forgottenPassword.code).toBe(expectedForgottenPassword.code)
        expect(forgottenPassword.date).toBe(expectedForgottenPassword.date)
        expect(forgottenPassword.username).toBe(expectedForgottenPassword.username)
        expect(forgottenPassword._links.length).toBe(expectedForgottenPassword._links.length)
      });
    })
  })

  describe('not found', () => {
    let code = 'non-existent-code'

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${FORGOTTEN_PASSWORD_PATH}/${code}`)
          .withState('a valid (non-expired) forgotten password entry does not exist')
          .withUponReceiving('a forgotten password request for non existent code')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error if no valid forgotten password entry', () => {
      return adminusersClient.getForgottenPassword(code)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(404)
        );
    })
  })
})
