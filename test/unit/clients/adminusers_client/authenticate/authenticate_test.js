'use strict'

// NPM dependencies
const Pact = require('pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Local dependencies
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
const userFixtures = require('../../../../fixtures/user_fixtures')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${port}`})
const User = require('../../../../../app/models/User.class')

// Constants
const AUTHENTICATE_PATH = '/v1/api/users/authenticate'

chai.use(chaiAsPromised)
const expect = chai.expect

// Note: the browser tests use values in the fixed config below, which match the defined interations
const ssUserConfig = require('../../../../fixtures/config/self_service_user')
const ssDefaultUser = ssUserConfig.config.users.filter(fil => fil.is_primary)[0]

describe('adminusers client - authenticate', function () {
  let provider = Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after((done) => provider.finalize().then(done()))

  describe('success', () => {
    const validPasswordResponse = userFixtures.validPasswordAuthenticateResponse(ssDefaultUser)
    const validPasswordRequestPactified = userFixtures
      .validPasswordAuthenticateRequest({
        username: ssDefaultUser.username,
        usernameMatcher: ssDefaultUser.usernameMatcher,
        password: ssDefaultUser.valid_password,
        passwordMatcher: ssDefaultUser.valid_passwordMatcher
      })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${AUTHENTICATE_PATH}`)
          .withUponReceiving('a correct password for a user')
          .withState(`user with email address ${ssDefaultUser.username} exists in the database with the correct with a correct password set to: ${ssDefaultUser.valid_password}`)
          .withMethod('POST')
          .withRequestBody(validPasswordRequestPactified)
          .withResponseBody(validPasswordResponse.getPactified())
          .withStatusCode(200)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return the right authentication success response', done => {
      adminusersClient.authenticateUser(ssDefaultUser.username, ssDefaultUser.valid_password).then((response) => {
        expect(response).to.deep.equal(new User(validPasswordResponse.getPlain()))
        done()
      })
    })
  })

  describe('failure', () => {
    const invalidPasswordResponse = userFixtures.invalidPasswordAuthenticateResponse()
    const invalidPasswordRequestPactified = userFixtures
      .invalidPasswordAuthenticateRequest({
        username: ssDefaultUser.username,
        usernameMatcher: ssDefaultUser.usernameMatcher,
        password: ssDefaultUser.invalid_password,
        passwordMatcher: ssDefaultUser.invalid_passwordMatcher
      })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${AUTHENTICATE_PATH}`)
          .withUponReceiving('an incorrect password for a user')
          .withState(`user with email address ${ssDefaultUser.username} exists in the database with the correct with a correct password set to: ${ssDefaultUser.valid_password}`)
          .withMethod('POST')
          .withRequestBody(invalidPasswordRequestPactified)
          .withResponseBody(invalidPasswordResponse.getPactified())
          .withStatusCode(401)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return the right authentication failure response', done => {
      adminusersClient.authenticateUser(ssDefaultUser.username, ssDefaultUser.invalid_password).then(() => {
        done('should not resolve here')
      }).catch(err => {
        expect(err.errorCode).to.equal(401)
        expect(err.message.errors).to.deep.equal(invalidPasswordResponse.getPlain().errors)
        done()
      })
    })
  })
})
