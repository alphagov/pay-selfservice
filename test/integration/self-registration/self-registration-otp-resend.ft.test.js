
'use strict'

const nock = require('nock')
const csrf = require('csrf')
const supertest = require('supertest')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const cheerio = require('cheerio')

const mockSession = require('../../test-helpers/mock-session')
const getApp = require('../../../server').getApp
const inviteFixtures = require('../../fixtures/invite.fixtures')
const paths = require('../../../app/paths')

// Constants
const SERVICE_INVITE_OTP_RESEND_RESOURCE = '/v1/api/invites/otp/resend'
const ADMINUSERS_INVITES_URL = '/v1/api/invites'
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const expect = chai.expect
const inviteCode = 'a-valid-invite-code'

// Global setup
chai.use(chaiAsPromised)

let app

describe('create service OTP resend validation', function () {
  afterEach((done) => {
    nock.cleanAll()
    app = null
    done()
  })

  describe('get OTP resend page', function () {
    it('should render normally when register_invite cookie present and invite has password set', function (done) {
      const mockAdminUsersInviteResponse = inviteFixtures.validInviteResponse({password_set: true})

      adminusersMock.get(`${ADMINUSERS_INVITES_URL}/${inviteCode}`)
        .reply(200, mockAdminUsersInviteResponse)

      const telephoneNumber = '07700900000'

      app = mockSession.getAppWithRegisterInvitesCookie(getApp(), {
        code: inviteCode,
        telephone_number: '07700900000',
        email: 'test@test.test'
      })
      supertest(app)
        .get(paths.selfCreateService.otpResend)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input#telephone-number').val()).to.equal(telephoneNumber)
        })
        .end(done)
    })

    it('should return an error when register_invite cookie not present', function (done) {
      app = mockSession.getAppWithLoggedOutSession(getApp())
      supertest(app)
        .get(paths.selfCreateService.otpResend)
        .expect(400)
        .end(done)
    })
  })

  it('should render an error when the invite is not found', function (done) {
    adminusersMock.get(`${ADMINUSERS_INVITES_URL}/${inviteCode}`).reply(404)

    app = mockSession.getAppWithRegisterInvitesCookie(getApp(), {
      code: inviteCode,
      telephone_number: '07700900000',
      email: 'test@test.test'
    })
    supertest(app)
      .get(paths.selfCreateService.otpResend)
      .expect(404)
      .end(done)
  })

  it('should render an error when the invite is expired or disabled', function (done) {
    adminusersMock.get(`${ADMINUSERS_INVITES_URL}/${inviteCode}`).reply(410)

    app = mockSession.getAppWithRegisterInvitesCookie(getApp(), {
      code: inviteCode,
      telephone_number: '07700900000',
      email: 'test@test.test'
    })
    supertest(app)
      .get(paths.selfCreateService.otpResend)
      .expect(410)
      .end(done)
  })

  it('should render an error when the password is not set in the invite', function (done) {
    const mockAdminUsersInviteResponse = inviteFixtures.validInviteResponse({password_set: false})

    adminusersMock.get(`${ADMINUSERS_INVITES_URL}/${inviteCode}`)
      .reply(200, mockAdminUsersInviteResponse)

    app = mockSession.getAppWithRegisterInvitesCookie(getApp(), {
      code: inviteCode,
      telephone_number: '07700900000',
      email: 'test@test.test'
    })
    supertest(app)
      .get(paths.selfCreateService.otpResend)
      .expect(400)
      .end(done)
  })

  describe('post to OTP resend page', function () {
    it('should redirect to OTP verify page on valid telephone number submission', function (done) {
      const validServiceInviteOtpResendRequestPlain = inviteFixtures.validResendOtpCodeRequest()
      const registerInviteData = {
        code: validServiceInviteOtpResendRequestPlain.code,
        telephone_number: validServiceInviteOtpResendRequestPlain.telephone_number,
        email: 'test@test.test'
      }

      adminusersMock.post(`${SERVICE_INVITE_OTP_RESEND_RESOURCE}`, validServiceInviteOtpResendRequestPlain)
        .reply(200)

      app = mockSession.getAppWithRegisterInvitesCookie(getApp(), registerInviteData)
      supertest(app)
        .post('/create-service/resend-otp')
        .send({
          'telephone-number': validServiceInviteOtpResendRequestPlain.telephone_number,
          csrfToken: csrf().create('123')
        })
        .expect(303)
        .expect('Location', paths.selfCreateService.otpVerify)
        .end(done)
    })

    it('should ignore cookie telephone number', function (done) {
      const submittedTelephoneNumber = '07451234567'
      const validServiceInviteOtpResendRequestPlain = inviteFixtures.validResendOtpCodeRequest()
      const registerInviteData = {
        code: validServiceInviteOtpResendRequestPlain.code,
        telephone_number: validServiceInviteOtpResendRequestPlain.telephone_number,
        email: 'test@test.test'
      }

      adminusersMock.post(`${SERVICE_INVITE_OTP_RESEND_RESOURCE}`, {
        telephone_number: submittedTelephoneNumber,
        code: registerInviteData.code
      }).reply(200)

      app = mockSession.getAppWithRegisterInvitesCookie(getApp(), registerInviteData)
      supertest(app)
        .post('/create-service/resend-otp')
        .send({
          'telephone-number': submittedTelephoneNumber,
          csrfToken: csrf().create('123')
        })
        .expect(303)
        .expect('Location', paths.selfCreateService.otpVerify)
        .expect(() => {
          expect(registerInviteData.telephone_number).to.be.equal(submittedTelephoneNumber)
        })
        .end(done)
    })

    it('should return error when register_invite cookie not present', function (done) {
      const validServiceInviteOtpResendRequestPlain = inviteFixtures.validResendOtpCodeRequest()

      app = mockSession.getAppWithLoggedOutSession(getApp())
      supertest(app)
        .post('/create-service/resend-otp')
        .send({
          'telephone-number': validServiceInviteOtpResendRequestPlain.telephone_number,
          csrfToken: csrf().create('123')
        })
        .expect(400)
        .end(done)
    })
  })
})
