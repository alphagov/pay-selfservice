const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const _ = require('lodash')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const userFixtures = require('../../../../fixtures/user.fixtures')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { userResponsePactifier } = require('../../../../test-helpers/pact/pactifier')

chai.use(chaiAsPromised)
chai.should()

const expect = chai.expect
const USER_PATH = '/v1/api/users'
let adminUsersClient

describe('adminusers client - authenticate', function () {
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

  describe('authenticate user API - success', () => {
    const request = userFixtures.validAuthenticateRequest({ username: 'existing-user' })
    const validUserResponse = userFixtures.validUserResponse()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/authenticate`)
          .withState('a user exists')
          .withUponReceiving('a valid user authenticate request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseBody(userResponsePactifier.pactify(validUserResponse))
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should authenticate a user successfully', function (done) {
      adminUsersClient.authenticateUser(request.username, request.password).should.be.fulfilled.then(function (user) {
        expect(user.username).to.be.equal(validUserResponse.username)
        expect(user.email).to.be.equal(validUserResponse.email)
        expect(_.isEqual(user.serviceRoles[0].gatewayAccountIds, validUserResponse.service_roles[0].gateway_account_ids)).to.be.equal(true)
        expect(user.telephoneNumber).to.be.equal(validUserResponse.telephone_number)
        expect(user.otpKey).to.be.equal(validUserResponse.otp_key)
        expect(user.serviceRoles[0].role.name).to.be.equal(validUserResponse.service_roles[0].role.name)
        expect(user.serviceRoles[0].role.permissions.length).to.be.equal(validUserResponse.service_roles[0].role.permissions.length)
      }).should.notify(done)
    })
  })

  describe('authenticate user API - unauthorized', () => {
    const request = userFixtures.validAuthenticateRequest({ username: 'nonexisting' })

    const unauthorizedResponse = userFixtures.unauthorizedUserResponse()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/authenticate`)
          .withState('a user not exists with a given username password')
          .withUponReceiving('a user authenticate request with no matching user')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(401)
          .withResponseBody(userResponsePactifier.pactify(unauthorizedResponse))
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should fail authentication if invalid username / password', function (done) {
      adminUsersClient.authenticateUser(request.username, request.password).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(401)
        expect(response.message.errors.length).to.equal(1)
        expect(response.message.errors).to.deep.equal(unauthorizedResponse.errors)
      }).should.notify(done)
    })
  })

  describe('authenticate user API - bad request', () => {
    const request = { username: '', password: '' }

    const badAuthenticateResponse = userFixtures.badAuthenticateResponse()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/authenticate`)
          .withState('a user exists with a given username password')
          .withUponReceiving('a user authenticate request with malformed request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(400)
          .withResponseBody(userResponsePactifier.pactify(badAuthenticateResponse))
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error bad request if mandatory fields are missing', function (done) {
      adminUsersClient.authenticateUser(request.username, request.password).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
        expect(response.message.errors.length).to.equal(2)
        expect(response.message.errors).to.deep.equal(badAuthenticateResponse.errors)
      }).should.notify(done)
    })
  })
})
