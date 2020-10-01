const { Pact } = require('@pact-foundation/pact')
var path = require('path')
const { expect } = require('chai')
var _ = require('lodash')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
var userFixtures = require('../../../../fixtures/user.fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder


const USER_PATH = '/v1/api/users'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - authenticate', function () {
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

  describe('authenticate user API - success', () => {
    let request = userFixtures.validAuthenticateRequest({ username: 'existing-user' })
    let validUserResponse = userFixtures.validUserResponse()

    before((done) => {
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

    it('should authenticate a user successfully', function () {
      let requestData = request.getPlain()

      return adminusersClient.authenticateUser(requestData.username, requestData.password).then(function (user) {
        let expectedUser = validUserResponse.getPlain()
        expect(user.username).to.be.equal(expectedUser.username)
        expect(user.email).to.be.equal(expectedUser.email)
        expect(_.isEqual(user.serviceRoles[0].gatewayAccountIds, expectedUser.service_roles[0].gateway_account_ids)).to.be.equal(true)
        expect(user.telephoneNumber).to.be.equal(expectedUser.telephone_number)
        expect(user.otpKey).to.be.equal(expectedUser.otp_key)
        expect(user.serviceRoles[0].role.name).to.be.equal(expectedUser.service_roles[0].role.name)
        expect(user.serviceRoles[0].role.permissions.length).to.be.equal(expectedUser.service_roles[0].role.permissions.length)
      })
    })
  })

  describe('authenticate user API - unauthorized', () => {
    let request = userFixtures.validAuthenticateRequest({ username: 'nonexisting' })

    let unauthorizedResponse = userFixtures.unauthorizedUserResponse()

    before((done) => {
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

    it('should fail authentication if invalid username / password', function () {
      let requestData = request.getPlain()
      return adminusersClient.authenticateUser(requestData.username, requestData.password)
        .then(
          () => { throw new Error('Expected to reject') },
          (err) => {
            expect(err.errorCode).to.equal(401)
            expect(err.message.errors.length).to.equal(1)
            expect(err.message.errors).to.deep.equal(unauthorizedResponse.getPlain().errors)
          }
        )
    })
  })

  describe('authenticate user API - bad request', () => {
    let request = { username: '', password: '' }

    let badAuthenticateResponse = userFixtures.badAuthenticateResponse()

    before((done) => {
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

    it('should error bad request if mandatory fields are missing', function () {
      return adminusersClient.authenticateUser(request.username, request.password)
        .then(
          () => { throw new Error('Expected to reject') },
          (err) => {
            expect(err.errorCode).to.equal(400)
            expect(err.message.errors.length).to.equal(2)
            expect(err.message.errors).to.deep.equal(badAuthenticateResponse.getPlain().errors)
          }
        )
    })
  })
})
