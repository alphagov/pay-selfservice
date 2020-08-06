const { Pact } = require('@pact-foundation/pact')
var path = require('path')
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
var userFixtures = require('../../../../fixtures/user.fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
chai.use(chaiAsPromised)
const expect = chai.expect
const FORGOTTEN_PASSWORD_PATH = '/v1/api/forgotten-passwords'

describe('adminusers client - create forgotten password', function () {
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

  describe('success', () => {
    const username = 'existing-user'
    let request = userFixtures.validForgottenPasswordCreateRequest(username)

    before((done) => {
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

    it('should create a forgotten password entry successfully', function (done) {
      let requestData = request.getPlain()
      adminusersClient.createForgottenPassword(requestData.username).should.notify(done)
    })
  })

  describe('bad request', () => {
    let request = { username: '' }

    let badForgottenPasswordResponse = userFixtures.badForgottenPasswordResponse()

    before((done) => {
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

    it('should error when forgotten password creation if mandatory fields are missing', function (done) {
      adminusersClient.createForgottenPassword(request.username).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
        expect(response.message.errors.length).to.equal(1)
        expect(response.message.errors).to.deep.equal(badForgottenPasswordResponse.getPlain().errors)
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    let request = userFixtures.validForgottenPasswordCreateRequest('nonexisting')

    before((done) => {
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

    it('should error when forgotten password creation if no user found', function (done) {
      let requestData = request.getPlain()
      adminusersClient.createForgottenPassword(requestData.username).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
