'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const inviteFixtures = require('../../../../fixtures/invite.fixtures')
const { pactify } = require('../../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const INVITE_RESOURCE = '/v1/api/invites'
let adminUsersClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('submit resend otp code API', function () {
  let provider = new Pact({
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

  describe('success', () => {
    const validOtpResend = inviteFixtures.validResendOtpCodeRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/resend`)
          .withUponReceiving('a resend otp code submission')
          .withMethod('POST')
          .withRequestBody(validOtpResend)
          .withStatusCode(200)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should submit otp code resend successfully', function (done) {
      adminUsersClient.resendOtpCode(validOtpResend.code, validOtpResend.telephone_number).should.be.fulfilled
        .should.notify(done)
    })
  })

  describe('bad request', () => {
    const validOtpResend = inviteFixtures.validResendOtpCodeRequest()
    validOtpResend.code = ''
    const errorResponse = inviteFixtures.badRequestResponseWhenFieldsMissing(['code'])

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/resend`)
          .withUponReceiving('a resend otp code submission with missing code')
          .withMethod('POST')
          .withRequestBody(validOtpResend)
          .withStatusCode(400)
          .withResponseBody(pactify(errorResponse))
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return 400 on missing fields', function (done) {
      adminUsersClient.resendOtpCode(validOtpResend.code, validOtpResend.telephone_number).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
        expect(response.message.errors.length).to.equal(1)
        expect(response.message.errors[0]).to.equal('Field [code] is required')
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const validOtpResend = inviteFixtures.validResendOtpCodeRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/resend`)
          .withUponReceiving('a resend otp code submission of non existent code')
          .withMethod('POST')
          .withRequestBody(validOtpResend)
          .withStatusCode(404)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return 404 when code is not found/expired', function (done) {
      adminUsersClient.resendOtpCode(validOtpResend.code, validOtpResend.telephone_number).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
