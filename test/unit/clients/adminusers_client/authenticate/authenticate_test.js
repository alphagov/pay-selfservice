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

describe('adminusers client - authenticate', () => {
  const provider = Pact({
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

  const existingUsername = 'some-user@gov.uk'
  const validPassword = 'some-valid-password'

  describe('success', () => {
    const validPasswordResponse = userFixtures.validPasswordAuthenticateResponse({ username: existingUsername })
    const validPasswordRequestPactified = userFixtures
      .validPasswordAuthenticateRequest({
        username: existingUsername,
        usernameMatcher: existingUsername,
        password: validPassword,
        passwordMatcher: validPassword
      })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${AUTHENTICATE_PATH}`)
          .withUponReceiving('a correct password for a user')
          .withState(`user with email address ${existingUsername} exists in the database with the correct with a correct password set to: ${validPassword}`)
          .withMethod('POST')
          .withRequestBody(validPasswordRequestPactified)
          .withResponseBody(validPasswordResponse.getPactified())
          .withStatusCode(200)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return the right authentication success response', done => {
      adminusersClient.authenticateUser(existingUsername, validPassword).then((response) => {
        expect(response).to.deep.equal(new User(validPasswordResponse.getPlain()))
        done()
      })
    })
  })

  describe('failure', () => {
    const invalidPassword = 'some-password'
    const invalidPasswordResponse = userFixtures.invalidPasswordAuthenticateResponse()
    const invalidPasswordRequestPactified = userFixtures
      .invalidPasswordAuthenticateRequest({
        username: existingUsername,
        usernameMatcher: existingUsername,
        password: invalidPassword,
        passwordMatcher: invalidPassword
      })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${AUTHENTICATE_PATH}`)
          .withUponReceiving('an incorrect password for a user')
          .withState(`user with email address ${existingUsername} exists in the database with the correct with a correct password set to: ${validPassword}`)
          .withMethod('POST')
          .withRequestBody(invalidPasswordRequestPactified)
          .withResponseBody(invalidPasswordResponse.getPactified())
          .withStatusCode(401)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return the right authentication failure response', done => {
      adminusersClient.authenticateUser(existingUsername, invalidPassword).then(() => {
        done('should not resolve here')
      }).catch(err => {
        expect(err.errorCode).to.equal(401)
        expect(err.message.errors).to.deep.equal(invalidPasswordResponse.getPlain().errors)
        done()
      })
    })
  })
})
