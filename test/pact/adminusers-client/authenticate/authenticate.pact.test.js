'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const userFixtures = require('../../../fixtures/user.fixtures')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const User = require('../../../../app/models/User.class')
const { userResponsePactifier } = require('../../../test-helpers/pact/pactifier')

// Constants
const AUTHENTICATE_PATH = '/v1/api/users/authenticate'

let adminUsersClient

chai.use(chaiAsPromised)
const expect = chai.expect

describe('adminusers client - authenticate', () => {
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

  const existingUserEmail = 'existing-user@example.com'
  const validPassword = 'password'

  describe('user is authenticated successfully', () => {
    const validPasswordResponse = userFixtures.validUserResponse({ email: existingUserEmail })
    const request = userFixtures.validPasswordAuthenticateRequest({
        email: existingUserEmail,
        password: validPassword
      })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${AUTHENTICATE_PATH}`)
          .withUponReceiving('a correct password for a user')
          .withState(`a user exists with email ${existingUserEmail} and password ${validPassword}`)
          .withMethod('POST')
          .withRequestBody(request)
          .withResponseBody(userResponsePactifier.pactify(validPasswordResponse))
          .withStatusCode(200)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return the right authentication success response', done => {
      adminUsersClient.authenticateUser(existingUserEmail, validPassword).then((response) => {
        expect(response).to.deep.equal(new User(validPasswordResponse))
        done()
      })
    })
  })

  describe('user authentication fails', () => {
    const invalidPassword = 'some-password'
    const invalidPasswordResponse = userFixtures.invalidPasswordAuthenticateResponse()
    const request = userFixtures
      .validPasswordAuthenticateRequest({
        email: existingUserEmail,
        password: invalidPassword
      })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${AUTHENTICATE_PATH}`)
          .withUponReceiving('an incorrect password for a user')
          .withState(`a user exists with email ${existingUserEmail} and password ${validPassword}`)
          .withMethod('POST')
          .withRequestBody(request)
          .withResponseBody(userResponsePactifier.pactify(invalidPasswordResponse))
          .withStatusCode(401)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return the right authentication failure response', done => {
      adminUsersClient.authenticateUser(existingUserEmail, invalidPassword).then(() => {
        done('should not resolve here')
      }).catch(err => {
        expect(err.errorCode).to.equal(401)
        expect(err.message).to.deep.equal(invalidPasswordResponse.errors.join(', '))
        done()
      })
    })
  })
})
