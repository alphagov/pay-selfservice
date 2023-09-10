const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const registrationFixtures = require('../../../fixtures/invite.fixtures')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

chai.use(chaiAsPromised)

const expect = chai.expect
const OTP_VALIDATE_RESOURCE = '/v2/api/invites/otp/validate'
let adminUsersClient

describe('adminusers client - validate otp code for a service', function () {
  const provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(async () => {
    const opts = await provider.setup()
    adminUsersClient = getAdminUsersClient({ baseUrl: `http://127.0.0.1:${opts.port}` })
  })
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

    it('should verify invite otp code successfully', function (done) {
      adminUsersClient.verifyOtpForInvite(validRequest.code, validRequest.otp).should.be.fulfilled
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
      adminUsersClient.verifyOtpForInvite(verifyCodeRequest.code, verifyCodeRequest.otp).should.be.rejected.then(function (err) {
        expect(err.errorCode).to.equal(400)
        expect(err.message).to.equal('Field [code] is required')
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
      adminUsersClient.verifyOtpForInvite(verifyCodeRequest.code, verifyCodeRequest.otp).should.be.rejected.then(function (response) {
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
      adminUsersClient.verifyOtpForInvite(verifyCodeRequest.code, verifyCodeRequest.otp).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(410)
      }).should.notify(done)
    })
  })
})
