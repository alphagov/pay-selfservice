const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const userFixtures = require('../../../../fixtures/user.fixtures')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { pactify } = require('../../../../test-helpers/pact/pactifier').defaultPactifier

const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
chai.use(chaiAsPromised)
const expect = chai.expect
const FORGOTTEN_PASSWORD_PATH = '/v1/api/forgotten-passwords'

describe('adminusers client - get forgotten password', function () {
  const provider = new Pact({
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
    const code = 'existing-code'
    const validForgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ code: code })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${FORGOTTEN_PASSWORD_PATH}/${code}`)
          .withState('a forgotten password entry exist')
          .withUponReceiving('forgotten password get request')
          .withResponseBody(pactify(validForgottenPasswordResponse))
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should GET a forgotten password entry', function (done) {
      adminusersClient.getForgottenPassword(code).should.be.fulfilled.then(function (forgottenPassword) {
        expect(forgottenPassword.code).to.be.equal(validForgottenPasswordResponse.code)
        expect(forgottenPassword.date).to.be.equal(validForgottenPasswordResponse.date)
        expect(forgottenPassword.username).to.be.equal(validForgottenPasswordResponse.username)
        expect(forgottenPassword._links.length).to.be.equal(validForgottenPasswordResponse._links.length)
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const code = 'non-existent-code'

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

    it('should error if no valid forgotten password entry', function (done) {
      adminusersClient.getForgottenPassword(code).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
