const { Pact } = require('@pact-foundation/pact')
var path = require('path')
const { expect } = require('chai')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
var registrationFixtures = require('../../../../fixtures/invite.fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

const INVITE_RESOURCE = '/v1/api/invites'
var port = Math.floor(Math.random() * 48127) + 1024
var adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - submit verification details', function () {
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

  context('verify otp code - success', () => {
    let validRequest = registrationFixtures.validVerifyOtpCodeRequest()

    before((done) => {
      let pactified = validRequest.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/validate`)
          .withUponReceiving('a valid otp code submission')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(201)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should verify otp code successfully', function () {
      let securityCode = validRequest.getPlain()
      return adminusersClient.verifyOtpAndCreateUser(securityCode.code, securityCode.otp)
    })
  })

  describe('bad request', () => {
    let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()
    verifyCodeRequest.code = ''
    let errorResponse = registrationFixtures.badRequestResponseWhenFieldsMissing(['code'])

    before((done) => {
      let pactified = verifyCodeRequest.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/validate`)
          .withUponReceiving('a verify otp code request with missing code')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(400)
          .withResponseBody(errorResponse.getPactified())
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return 400 on missing fields', function () {
      let verifyCodeData = verifyCodeRequest.getPlain()
      return adminusersClient.verifyOtpAndCreateUser(verifyCodeData.code, verifyCodeData.otp)
        .then(
          () => { throw new Error('Expected to reject') },
          (err) => {
            expect(err.errorCode).to.equal(400)
            expect(err.message.errors.length).to.equal(1)
            expect(err.message.errors[0]).to.equal('Field [code] is required')
          }
        )
    })
  })

  describe('invitation not found', () => {
    let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()

    before((done) => {
      let pactified = verifyCodeRequest.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/validate`)
          .withUponReceiving('a verify otp code request with non existent code')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(404)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return 404 if code cannot be found', function () {
      let request = verifyCodeRequest.getPlain()
      return adminusersClient.verifyOtpAndCreateUser(request.code, request.otp)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).to.equal(404)
        )
    })
  })

  describe('submit registration details API - invitation locked', () => {
    let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()

    before((done) => {
      let pactified = verifyCodeRequest.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/validate`)
          .withUponReceiving('a registration details submission for locked code')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(410)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('return 410 if code locked', function () {
      let request = verifyCodeRequest.getPlain()
      return adminusersClient.verifyOtpAndCreateUser(request.code, request.otp)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).to.equal(410)
        )
    })
  })
})
