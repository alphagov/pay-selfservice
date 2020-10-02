const { Pact } = require('@pact-foundation/pact')
var path = require('path')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
var userFixtures = require('../../../../fixtures/user.fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const FORGOTTEN_PASSWORD_PATH = '/v1/api/forgotten-passwords'

describe('adminusers client - create forgotten password', () => {
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
    const username = 'existing-user'
    let request = userFixtures.validForgottenPasswordCreateRequest(username)

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(FORGOTTEN_PASSWORD_PATH)
          .withState(`a user exists with username ${username}`)
          .withUponReceiving('a valid forgotten password request')
          .withMethod('POST')
          .withRequestBody(request.getPlain())
          .withStatusCode(200)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should create a forgotten password entry successfully', () => {
      let requestData = request.getPlain()
      return adminusersClient.createForgottenPassword(requestData.username)
    })
  })

  describe('bad request', () => {
    let request = { username: '' }

    let badForgottenPasswordResponse = userFixtures.badForgottenPasswordResponse()

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(FORGOTTEN_PASSWORD_PATH)
          .withUponReceiving('an invalid forgotten password request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(400)
          .withResponseBody(badForgottenPasswordResponse.getPactified())
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it(
      'should error when forgotten password creation if mandatory fields are missing',
      () => {
        return adminusersClient.createForgottenPassword(request.username)
          .then(
            () => { throw new Error('Expected to reject') },
            (err) => {
              expect(err.errorCode).toBe(400)
              expect(err.message.errors.length).toBe(1)
              expect(err.message.errors).toEqual(badForgottenPasswordResponse.getPlain().errors)
            }
          );
      }
    )
  })

  describe('not found', () => {
    let request = userFixtures.validForgottenPasswordCreateRequest('nonexisting')

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(FORGOTTEN_PASSWORD_PATH)
          .withState('a user does not exist')
          .withUponReceiving('a forgotten password request for non existent user')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it(
      'should error when forgotten password creation if no user found',
      () => {
        let requestData = request.getPlain()
        return adminusersClient.createForgottenPassword(requestData.username)
          .then(
            () => { throw new Error('Expected to reject') },
            err => expect(err.errorCode).toBe(404)
          );
      }
    )
  })
})
