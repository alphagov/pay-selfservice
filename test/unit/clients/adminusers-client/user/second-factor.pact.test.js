const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const userFixtures = require('../../../../fixtures/user.fixtures')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { userResponsePactifier } = require('../../../../test-helpers/pact/pactifier')

chai.use(chaiAsPromised)

const expect = chai.expect
const USER_PATH = '/v1/api/users'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

const existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'

describe('adminusers client', function () {
  const provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('send new second factor API - success', () => {
    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/second-factor`)
          .withState('a user exists')
          .withUponReceiving('a valid second factor post request')
          .withMethod('POST')
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should send a new 2FA token successfully', function (done) {
      adminusersClient.sendSecondFactor(existingExternalId).should.be.fulfilled.notify(done)
    })
  })

  describe('send new 2FA token API - user not found', () => {
    const externalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // non existent external id

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${externalId}/second-factor`)
          .withUponReceiving('a second factor post request for a non-existent user')
          .withMethod('POST')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return not found if user not exist', function (done) {
      adminusersClient.sendSecondFactor(externalId).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })

  describe('authenticate a second factor API - success', () => {
    const token = '121212'
    const request = userFixtures.validAuthenticateSecondFactorRequest(token)
    const response = userFixtures.validUserResponse({ external_id: existingExternalId })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/second-factor/authenticate`)
          .withState('a user exists')
          .withUponReceiving('a valid authenticate second factor token request')
          .withRequestBody(request)
          .withResponseBody(userResponsePactifier.pactify(response))
          .withMethod('POST')
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('authenticate a valid 2FA token successfully', function (done) {
      adminusersClient.authenticateSecondFactor(existingExternalId, token).should.be.fulfilled.then(function (createdUser) {
        expect(createdUser.externalId).to.be.equal(existingExternalId)
      }).should.notify(done)
    })
  })

  describe('authenticate second factor API - bad request', () => {
    const token = 'non-numeric-code'
    const request = userFixtures.validAuthenticateSecondFactorRequest(token)
    const existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/second-factor/authenticate`)
          .withState('a user exists')
          .withUponReceiving('a invalid authenticate second factor token request')
          .withRequestBody(request)
          .withMethod('POST')
          .withStatusCode(400)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('error bad request an invalid 2FA token', function (done) {
      adminusersClient.authenticateSecondFactor(existingExternalId, token).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
      }).should.notify(done)
    })
  })

  describe('authenticate second factor API - unauthorized', () => {
    const token = '654321'
    const request = userFixtures.validAuthenticateSecondFactorRequest(token)
    const existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/second-factor/authenticate`)
          .withState('a user exists')
          .withUponReceiving('an expired/unauthorized second factor token request')
          .withRequestBody(request)
          .withMethod('POST')
          .withStatusCode(401)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('error unauthorized an expired/unauthorized 2FA token', function (done) {
      adminusersClient.authenticateSecondFactor(existingExternalId, token).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(401)
      }).should.notify(done)
    })
  })
})
