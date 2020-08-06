const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const registrationFixtures = require('../../../../fixtures/invite.fixtures')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

chai.use(chaiAsPromised)

const expect = chai.expect
const OTP_VALIDATE_RESOURCE = '/v1/api/invites/otp/validate/service'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - validate otp code for a service', function () {
  let provider = new Pact({
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
    let validRequest = registrationFixtures.validVerifyOtpCodeRequest({ code: 'aValidCode' })

    before((done) => {
      let pactified = validRequest.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${OTP_VALIDATE_RESOURCE}`)
          .withState('a service invite exists with the given code')
          .withUponReceiving('a valid service otp code submission')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(200)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should verify service otp code successfully', function (done) {
      let securityCode = validRequest.getPlain()
      adminusersClient.verifyOtpForServiceInvite(securityCode.code, securityCode.otp).should.be.fulfilled
        .should.notify(done)
    })
  })

  describe('bad request', () => {
    let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()
    verifyCodeRequest.code = ''
    let errorResponse = registrationFixtures.badRequestResponseWhenFieldsMissing(['code'])

    before((done) => {
      let pactified = verifyCodeRequest.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${OTP_VALIDATE_RESOURCE}`)
          .withUponReceiving('a verify service otp code request with missing code')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(400)
          .withResponseBody(errorResponse.getPactified())
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return 400 on missing fields', function (done) {
      let verifyCodeData = verifyCodeRequest.getPlain()
      adminusersClient.verifyOtpForServiceInvite(verifyCodeData.code, verifyCodeData.otp).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
        expect(response.message.errors.length).to.equal(1)
        expect(response.message.errors[0]).to.equal('Field [code] is required')
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()

    before((done) => {
      let pactified = verifyCodeRequest.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${OTP_VALIDATE_RESOURCE}`)
          .withUponReceiving('a verify service otp code request with non existent code')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(404)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return 404 if code cannot be found', function (done) {
      let request = verifyCodeRequest.getPlain()
      adminusersClient.verifyOtpForServiceInvite(request.code, request.otp).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })

  describe('invitation locked', () => {
    let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()

    before((done) => {
      let pactified = verifyCodeRequest.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${OTP_VALIDATE_RESOURCE}`)
          .withUponReceiving('a service registration details submission for locked code')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(410)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('return 410 if code locked', function (done) {
      let request = verifyCodeRequest.getPlain()
      adminusersClient.verifyOtpForServiceInvite(request.code, request.otp).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(410)
      }).should.notify(done)
    })
  })
})
