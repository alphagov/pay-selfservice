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
const INVITE_RESOURCE = '/v1/api/invites'
let adminUsersClient

describe('adminusers client - submit verification details', function () {
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
    adminUsersClient = getAdminUsersClient({ baseUrl: `http://localhost:${opts.port}` })
  })
  after(() => provider.finalize())

  context('verify otp code - success', () => {
    const validRequest = registrationFixtures.validVerifyOtpCodeRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/validate`)
          .withUponReceiving('a valid otp code submission')
          .withMethod('POST')
          .withRequestBody(validRequest)
          .withStatusCode(201)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should verify otp code successfully', function (done) {
      adminUsersClient.verifyOtpAndCreateUser(validRequest.code, validRequest.otp).should.be.fulfilled
        .should.notify(done)
    })
  })

  describe('bad request', () => {
    const verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()
    verifyCodeRequest.code = ''
    const errorResponse = registrationFixtures.badRequestResponseWhenFieldsMissing(['code'])

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/validate`)
          .withUponReceiving('a verify otp code request with missing code')
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
      adminUsersClient.verifyOtpAndCreateUser(verifyCodeRequest.code, verifyCodeRequest.otp).should.be.rejected.then(function (err) {
        expect(err.errorCode).to.equal(400)
        expect(err.message).to.equal('Field [code] is required')
      }).should.notify(done)
    })
  })

  describe('invitation not found', () => {
    const verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/validate`)
          .withUponReceiving('a verify otp code request with non existent code')
          .withMethod('POST')
          .withRequestBody(verifyCodeRequest)
          .withStatusCode(404)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return 404 if code cannot be found', function (done) {
      adminUsersClient.verifyOtpAndCreateUser(verifyCodeRequest.code, verifyCodeRequest.otp).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })

  describe('submit registration details API - invitation locked', () => {
    const verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/validate`)
          .withUponReceiving('a registration details submission for locked code')
          .withMethod('POST')
          .withRequestBody(verifyCodeRequest)
          .withStatusCode(410)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('return 410 if code locked', function (done) {
      adminUsersClient.verifyOtpAndCreateUser(verifyCodeRequest.code, verifyCodeRequest.otp).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(410)
      }).should.notify(done)
    })
  })
})
