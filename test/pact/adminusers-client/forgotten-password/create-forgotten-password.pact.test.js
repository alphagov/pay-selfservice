const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const userFixtures = require('../../../fixtures/user.fixtures')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

let adminUsersClient
chai.use(chaiAsPromised)
const expect = chai.expect
const FORGOTTEN_PASSWORD_PATH = '/v1/api/forgotten-passwords'

describe('adminusers client - create forgotten password', function () {
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

  describe('success', () => {
    const username = 'existing-user'
    const request = userFixtures.validForgottenPasswordCreateRequest(username)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(FORGOTTEN_PASSWORD_PATH)
          .withState(`a user exists with username ${username}`)
          .withUponReceiving('a valid forgotten password request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should create a forgotten password entry successfully', function (done) {
      adminUsersClient.createForgottenPassword(request.username).should.notify(done)
    })
  })

  describe('bad request', () => {
    const request = { username: '' }

    const badForgottenPasswordResponse = userFixtures.badForgottenPasswordResponse()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(FORGOTTEN_PASSWORD_PATH)
          .withUponReceiving('an invalid forgotten password request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(400)
          .withResponseBody(pactify(badForgottenPasswordResponse))
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error when forgotten password creation if mandatory fields are missing', function (done) {
      adminUsersClient.createForgottenPassword(request.username).should.be.rejected.then(function (err) {
        expect(err.errorCode).to.equal(400)
        expect(err.message).to.equal(badForgottenPasswordResponse.errors[0])
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const request = userFixtures.validForgottenPasswordCreateRequest('nonexisting')

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(FORGOTTEN_PASSWORD_PATH)
          .withState('a user does not exist')
          .withUponReceiving('a forgotten password request for non existent user')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error when forgotten password creation if no user found', function (done) {
      adminUsersClient.createForgottenPassword(request.username).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
