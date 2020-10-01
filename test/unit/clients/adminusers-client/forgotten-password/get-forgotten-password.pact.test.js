const { Pact } = require('@pact-foundation/pact')
var path = require('path')
const { expect } = require('chai')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
var userFixtures = require('../../../../fixtures/user.fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const FORGOTTEN_PASSWORD_PATH = '/v1/api/forgotten-passwords'

describe('adminusers client - get forgotten password', function () {
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
    let code = 'existing-code'
    let validForgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ code: code })
    let expectedForgottenPassword = validForgottenPasswordResponse.getPlain()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${FORGOTTEN_PASSWORD_PATH}/${code}`)
          .withState('a forgotten password entry exist')
          .withUponReceiving('forgotten password get request')
          .withResponseBody(validForgottenPasswordResponse.getPactified())
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should GET a forgotten password entry', function () {
      return adminusersClient.getForgottenPassword(code).then(function (forgottenPassword) {
        expect(forgottenPassword.code).to.be.equal(expectedForgottenPassword.code)
        expect(forgottenPassword.date).to.be.equal(expectedForgottenPassword.date)
        expect(forgottenPassword.username).to.be.equal(expectedForgottenPassword.username)
        expect(forgottenPassword._links.length).to.be.equal(expectedForgottenPassword._links.length)
      })
    })
  })

  describe('not found', () => {
    let code = 'non-existent-code'

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${FORGOTTEN_PASSWORD_PATH}/${code}`)
          .withState('a valid (non-expired) forgotten password entry does not exist')
          .withUponReceiving('a forgotten password request for non existent code')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should error if no valid forgotten password entry', function () {
      return adminusersClient.getForgottenPassword(code)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).to.equal(404)
        )
    })
  })
})
