'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const inviteFixtures = require('../../../../fixtures/invite.fixtures')

// Constants
const INVITE_RESOURCE = '/v1/api/invites'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

// Global setup

describe('submit resend otp code API', function () {
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
    const validOtpResend = inviteFixtures.validResendOtpCodeRequest()

    before((done) => {
      const pactified = validOtpResend.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/resend`)
          .withUponReceiving('a resend otp code submission')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(200)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should submit otp code resend successfully', function () {
      const registration = validOtpResend.getPlain()

      return adminusersClient.resendOtpCode(registration.code, registration.telephone_number)
    })
  })

  describe('bad request', () => {
    const validOtpResend = inviteFixtures.validResendOtpCodeRequest()
    validOtpResend.code = ''
    const errorResponse = inviteFixtures.badRequestResponseWhenFieldsMissing(['code'])

    before((done) => {
      const pactified = validOtpResend.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/resend`)
          .withUponReceiving('a resend otp code submission with missing code')
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
      const resendData = validOtpResend.getPlain()
      return adminusersClient.resendOtpCode(resendData.code, resendData.telephone_number)
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

  describe('not found', () => {
    const validOtpResend = inviteFixtures.validResendOtpCodeRequest()

    before((done) => {
      const pactified = validOtpResend.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/resend`)
          .withUponReceiving('a resend otp code submission of non existent code')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(404)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return 404 when code is not found/expired', function () {
      const resendData = validOtpResend.getPlain()
      return adminusersClient.resendOtpCode(resendData.code, resendData.telephone_number)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).to.equal(404)
        )
    })
  })
})
