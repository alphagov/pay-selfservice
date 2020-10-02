const { Pact } = require('@pact-foundation/pact')
var path = require('path')
var _ = require('lodash')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
var userFixtures = require('../../../../fixtures/user.fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

const USER_PATH = '/v1/api/users'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - authenticate', () => {
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

  describe('authenticate user API - success', () => {
    let request = userFixtures.validAuthenticateRequest({ username: 'existing-user' })
    let validUserResponse = userFixtures.validUserResponse()

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/authenticate`)
          .withState('a user exists')
          .withUponReceiving('a valid user authenticate request')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(200)
          .withResponseBody(validUserResponse.getPactified())
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should authenticate a user successfully', () => {
      let requestData = request.getPlain()

      return adminusersClient.authenticateUser(requestData.username, requestData.password).then(function (user) {
        let expectedUser = validUserResponse.getPlain()
        expect(user.username).toBe(expectedUser.username)
        expect(user.email).toBe(expectedUser.email)
        expect(_.isEqual(user.serviceRoles[0].gatewayAccountIds, expectedUser.service_roles[0].gateway_account_ids)).toBe(true)
        expect(user.telephoneNumber).toBe(expectedUser.telephone_number)
        expect(user.otpKey).toBe(expectedUser.otp_key)
        expect(user.serviceRoles[0].role.name).toBe(expectedUser.service_roles[0].role.name)
        expect(user.serviceRoles[0].role.permissions.length).toBe(expectedUser.service_roles[0].role.permissions.length)
      });
    })
  })

  describe('authenticate user API - unauthorized', () => {
    let request = userFixtures.validAuthenticateRequest({ username: 'nonexisting' })

    let unauthorizedResponse = userFixtures.unauthorizedUserResponse()

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/authenticate`)
          .withState('a user not exists with a given username password')
          .withUponReceiving('a user authenticate request with no matching user')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(401)
          .withResponseBody(unauthorizedResponse.getPactified())
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should fail authentication if invalid username / password', () => {
      let requestData = request.getPlain()
      return adminusersClient.authenticateUser(requestData.username, requestData.password)
        .then(
          () => { throw new Error('Expected to reject') },
          (err) => {
            expect(err.errorCode).toBe(401)
            expect(err.message.errors.length).toBe(1)
            expect(err.message.errors).toEqual(unauthorizedResponse.getPlain().errors)
          }
        );
    })
  })

  describe('authenticate user API - bad request', () => {
    let request = { username: '', password: '' }

    let badAuthenticateResponse = userFixtures.badAuthenticateResponse()

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/authenticate`)
          .withState('a user exists with a given username password')
          .withUponReceiving('a user authenticate request with malformed request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(400)
          .withResponseBody(badAuthenticateResponse.getPactified())
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error bad request if mandatory fields are missing', () => {
      return adminusersClient.authenticateUser(request.username, request.password)
        .then(
          () => { throw new Error('Expected to reject') },
          (err) => {
            expect(err.errorCode).toBe(400)
            expect(err.message.errors.length).toBe(2)
            expect(err.message.errors).toEqual(badAuthenticateResponse.getPlain().errors)
          }
        );
    })
  })
})
