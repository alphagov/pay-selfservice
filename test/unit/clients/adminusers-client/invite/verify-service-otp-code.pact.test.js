const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const registrationFixtures = require('../../../../fixtures/invite.fixtures')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

const OTP_VALIDATE_RESOURCE = '/v1/api/invites/otp/validate/service'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - validate otp code for a service', () => {
  let provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('success', () => {
    let validRequest = registrationFixtures.validVerifyOtpCodeRequest({ code: 'aValidCode' })

    beforeAll((done) => {
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

    it('should verify service otp code successfully', () => {
      let securityCode = validRequest.getPlain()
      return adminusersClient.verifyOtpForServiceInvite(securityCode.code, securityCode.otp)
    })
  })

  describe('bad request', () => {
    let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()
    verifyCodeRequest.code = ''
    let errorResponse = registrationFixtures.badRequestResponseWhenFieldsMissing(['code'])

    beforeAll((done) => {
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

    it('should return 400 on missing fields', () => {
      let verifyCodeData = verifyCodeRequest.getPlain()
      return adminusersClient.verifyOtpForServiceInvite(verifyCodeData.code, verifyCodeData.otp)
        .then(
          () => { throw new Error('Expected to reject') },
          (err) => {
            expect(err.errorCode).toBe(400)
            expect(err.message.errors.length).toBe(1)
            expect(err.message.errors[0]).toBe('Field [code] is required')
          }
        );
    })
  })

  describe('not found', () => {
    let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()

    beforeAll((done) => {
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

    it('should return 404 if code cannot be found', () => {
      let request = verifyCodeRequest.getPlain()
      return adminusersClient.verifyOtpForServiceInvite(request.code, request.otp)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(404)
        );
    })
  })

  describe('invitation locked', () => {
    let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()

    beforeAll((done) => {
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

    it('return 410 if code locked', () => {
      let request = verifyCodeRequest.getPlain()
      return adminusersClient.verifyOtpForServiceInvite(request.code, request.otp)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(410)
        );
    })
  })
})
