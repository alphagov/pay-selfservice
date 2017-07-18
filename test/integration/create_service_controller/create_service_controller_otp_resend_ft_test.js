'use strict'

// NPM dependencies
const nock = require('nock')
const csrf = require('csrf')
const supertest = require('supertest')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const mockSession = require('../../test_helpers/mock_session')
const getApp = require('../../../server').getApp
const inviteFixtures = require('../../fixtures/invite_fixtures')
const paths = require('../../../app/paths')

// Constants
const SERVICE_INVITE_OTP_RESEND_RESOURCE = '/v1/api/invites/otp/resend'
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

let app

describe('create service otp resend validation', function () {
  afterEach((done) => {
    nock.cleanAll()
    app = null
    done()
  })

  describe('get otp resend page', function () {
    it('should return an error when register_invite cookie not present', function (done) {
      app = mockSession.getAppWithLoggedOutSession(getApp())
      supertest(app)
        .get('/create-service/resend-otp')
        .expect(404)
        .end(done)
    })
  })

  describe('post to otp resend page', function () {
    it('should redirect to otp verify page on valid telephone number submission', function (done) {
      const validServiceInviteOtpResendRequestPlain = inviteFixtures.validResendOtpCodeRequest().getPlain()
      const registerInviteData = {
        code: validServiceInviteOtpResendRequestPlain.code,
        telephone_number: validServiceInviteOtpResendRequestPlain.telephone_number,
        email: 'bob@bob.com'
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
      const validServiceInviteOtpResendRequestPlain = inviteFixtures.validResendOtpCodeRequest().getPlain()
      const registerInviteData = {
        code: validServiceInviteOtpResendRequestPlain.code,
        telephone_number: validServiceInviteOtpResendRequestPlain.telephone_number,
        email: 'bob@bob.com'
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
      const validServiceInviteOtpResendRequestPlain = inviteFixtures.validResendOtpCodeRequest().getPlain()

      app = mockSession.getAppWithLoggedOutSession(getApp())
      supertest(app)
        .post('/create-service/resend-otp')
        .send({
          'telephone-number': validServiceInviteOtpResendRequestPlain.telephone_number,
          csrfToken: csrf().create('123')
        })
        .expect(404)
        .end(done)
    })
  })
})
