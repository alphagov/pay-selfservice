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
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const User = require('../../../../../app/models/User.class')

// Constants
const AUTHENTICATE_PATH = '/v1/api/users/authenticate'

chai.use(chaiAsPromised)
const expect = chai.expect

// Note: the browser tests use values in the fixed config below, which match the defined interations
const selfServiceUserConfig = require('../../../../fixtures/config/self_service_user')
const selfServiceDefaultUser = selfServiceUserConfig.config.users.filter(fil => fil.isPrimary === 'true')[0]

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

  selfServiceUserConfig.config.users.forEach(currentUser => {
    describe(`success "${currentUser.cypressTestingCategory}" user`, () => {
      const validPasswordResponse = userFixtures.validPasswordAuthenticateResponse(currentUser)
      const validPasswordRequestPactified = userFixtures
        .validPasswordAuthenticateRequest({
          username: currentUser.username,
          usernameMatcher: currentUser.usernameMatcher,
          password: currentUser.valid_password,
          passwordMatcher: currentUser.valid_passwordMatcher
        })

      before((done) => {
        provider.addInteraction(
          new PactInteractionBuilder(`${AUTHENTICATE_PATH}`)
            .withUponReceiving('a correct password for a user')
            .withState(`user with email address ${currentUser.username} exists in the database with the correct with a correct password set to: ${currentUser.valid_password}`)
            .withMethod('POST')
            .withRequestBody(validPasswordRequestPactified)
            .withResponseBody(validPasswordResponse.getPactified())
            .withStatusCode(200)
            .build()
        ).then(() => done())
      })

      afterEach(() => provider.verify())

      it('should return the right authentication success response', done => {
        adminusersClient.authenticateUser(currentUser.username, currentUser.valid_password).then((response) => {
          expect(response).to.deep.equal(new User(validPasswordResponse.getPlain()))
          done()
        })
      })
    })
  })

  describe('failure', () => {
    const invalidPasswordResponse = userFixtures.invalidPasswordAuthenticateResponse()
    const invalidPasswordRequestPactified = userFixtures
      .invalidPasswordAuthenticateRequest({
        username: selfServiceDefaultUser.username,
        usernameMatcher: selfServiceDefaultUser.usernameMatcher,
        password: selfServiceDefaultUser.invalid_password,
        passwordMatcher: selfServiceDefaultUser.invalid_passwordMatcher
      })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${AUTHENTICATE_PATH}`)
          .withUponReceiving('an incorrect password for a user')
          .withState(`user with email address ${selfServiceDefaultUser.username} exists in the database with the correct with a correct password set to: ${selfServiceDefaultUser.valid_password}`)
          .withMethod('POST')
          .withRequestBody(invalidPasswordRequestPactified)
          .withResponseBody(invalidPasswordResponse.getPactified())
          .withStatusCode(401)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return the right authentication failure response', done => {
      adminusersClient.authenticateUser(selfServiceDefaultUser.username, selfServiceDefaultUser.invalid_password).then(() => {
        done('should not resolve here')
      }).catch(err => {
        expect(err.errorCode).to.equal(401)
        expect(err.message.errors).to.deep.equal(invalidPasswordResponse.getPlain().errors)
        done()
      })
    })
  })
})
