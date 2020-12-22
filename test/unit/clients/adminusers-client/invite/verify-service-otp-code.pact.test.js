const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const registrationFixtures = require('../../../../fixtures/invite.fixtures')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { pactify } = require('../../../../test-helpers/pact/pactifier').defaultPactifier

chai.use(chaiAsPromised)

const expect = chai.expect
const OTP_VALIDATE_RESOURCE = '/v1/api/invites/otp/validate/service'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - validate otp code for a service', function () {
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

  describe('success', () => {
    const validRequest = registrationFixtures.validVerifyOtpCodeRequest({ code: 'aValidCode' })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${OTP_VALIDATE_RESOURCE}`)
          .withState('a service invite exists with the given code')
          .withUponReceiving('a valid service otp code submission')
          .withMethod('POST')
          .withRequestBody(validRequest)
          .withStatusCode(200)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should verify service otp code successfully', function (done) {
      adminusersClient.verifyOtpForServiceInvite(validRequest.code, validRequest.otp).should.be.fulfilled
        .should.notify(done)
    })
  })

  describe('bad request', () => {
    const verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()
    verifyCodeRequest.code = ''
    const errorResponse = registrationFixtures.badRequestResponseWhenFieldsMissing(['code'])

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${OTP_VALIDATE_RESOURCE}`)
          .withUponReceiving('a verify service otp code request with missing code')
          .withMethod('POST')
          .withRequestBody(verifyCodeRequest)
          .withStatusCode(400)
          .withResponseBody(pactify(errorResponse))
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return 400 on missing fields', function (done) {
      adminusersClient.verifyOtpForServiceInvite(verifyCodeRequest.code, verifyCodeRequest.otp).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
        expect(response.message.errors.length).to.equal(1)
        expect(response.message.errors[0]).to.equal('Field [code] is required')
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${OTP_VALIDATE_RESOURCE}`)
          .withUponReceiving('a verify service otp code request with non existent code')
          .withMethod('POST')
          .withRequestBody(verifyCodeRequest)
          .withStatusCode(404)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return 404 if code cannot be found', function (done) {
      adminusersClient.verifyOtpForServiceInvite(verifyCodeRequest.code, verifyCodeRequest.otp).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })

  describe('invitation locked', () => {
    const verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${OTP_VALIDATE_RESOURCE}`)
          .withUponReceiving('a service registration details submission for locked code')
          .withMethod('POST')
          .withRequestBody(verifyCodeRequest)
          .withStatusCode(410)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('return 410 if code locked', function (done) {
      adminusersClient.verifyOtpForServiceInvite(verifyCodeRequest.code, verifyCodeRequest.otp).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(410)
      }).should.notify(done)
    })
  })
})
