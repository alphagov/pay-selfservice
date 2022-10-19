'use strict'

const nock = require('nock')
const csrf = require('csrf')
const supertest = require('supertest')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const cheerio = require('cheerio')

const session = require('../../test-helpers/mock-session')
const getApp = require('../../../server').getApp
const inviteFixtures = require('../../fixtures/invite.fixtures')
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const userFixtures = require('../../fixtures/user.fixtures')
const paths = require('../../../app/paths')

// Constants
const INVITE_OTP_RESOURCE = '/v2/api/invites/otp/validate'
const CONNECTOR_ACCOUNTS_URL = '/v1/api/accounts'
const ADMINUSERS_INVITES_URL = '/v1/api/invites'
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const connectorMock = nock(process.env.CONNECTOR_URL)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const inviteCode = 'a-valid-invite-code'
const userExternalId = 'f84b8210f93d455e97baeaf3fea72cf4'
const serviceExternalId = '43a6818b522b4a628a14355614665ca3'
const gatewayAccountId = '1'
let app

describe('create service OTP validation', function () {
  afterEach((done) => {
    nock.cleanAll()
    app = null
    done()
  })

  describe('get OTP verify page', function () {
    it('should render normally when register_invite cookie present and invite has password set', function (done) {
      const mockAdminUsersInviteResponse = inviteFixtures.validInviteResponse({ password_set: true })

      adminusersMock.get(`${ADMINUSERS_INVITES_URL}/${inviteCode}`)
        .reply(200, mockAdminUsersInviteResponse)

      app = session.getAppWithRegisterInvitesCookie(getApp(), {
        code: inviteCode,
        telephone_number: '07700900000',
        email: 'test@test.test'
      })
      supertest(app)
        .get(paths.selfCreateService.otpVerify)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input#verify-code').length).to.equal(1)
        })
        .end(done)
    })

    it('should return an error when register_invite cookie not present', function (done) {
      app = session.getAppWithLoggedOutSession(getApp())
      supertest(app)
        .get(paths.selfCreateService.otpVerify)
        .expect(400)
        .end(done)
    })

    it('should render with errors when they are in recovered object in cookie', function (done) {
      const mockAdminUsersInviteResponse = inviteFixtures.validInviteResponse({ password_set: true })

      adminusersMock.get(`${ADMINUSERS_INVITES_URL}/${inviteCode}`)
        .reply(200, mockAdminUsersInviteResponse)

      const errorMessage = 'An error with the verification code'
      app = session.getAppWithRegisterInvitesCookie(getApp(), {
        code: inviteCode,
        telephone_number: '07700900000',
        email: 'test@test.test',
        recovered: {
          errors: {
            verificationCode: errorMessage
          }
        }
      })
      supertest(app)
        .get(paths.selfCreateService.otpVerify)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary__list li').length).to.equal(1)
          expect($('.govuk-error-summary__list li a[href$="#verify-code"]').text()).to.equal(errorMessage)
        })
        .end(done)
    })

    it('should render an error when the invite is not found', function (done) {
      adminusersMock.get(`${ADMINUSERS_INVITES_URL}/${inviteCode}`).reply(404)

      app = session.getAppWithRegisterInvitesCookie(getApp(), {
        code: inviteCode,
        telephone_number: '07700900000',
        email: 'test@test.test'
      })
      supertest(app)
        .get(paths.selfCreateService.otpVerify)
        .expect(404)
        .end(done)
    })

    it('should render an error when the invite is expired or disabled', function (done) {
      adminusersMock.get(`${ADMINUSERS_INVITES_URL}/${inviteCode}`).reply(410)

      app = session.getAppWithRegisterInvitesCookie(getApp(), {
        code: inviteCode,
        telephone_number: '07700900000',
        email: 'test@test.test'
      })
      supertest(app)
        .get(paths.selfCreateService.otpVerify)
        .expect(410)
        .end(done)
    })

    it('should render an error when the password is not set in the invite', function (done) {
      const mockAdminUsersInviteResponse = inviteFixtures.validInviteResponse({ password_set: false })

      adminusersMock.get(`${ADMINUSERS_INVITES_URL}/${inviteCode}`)
        .reply(200, mockAdminUsersInviteResponse)

      app = session.getAppWithRegisterInvitesCookie(getApp(), {
        code: inviteCode,
        telephone_number: '07700900000',
        email: 'test@test.test'
      })
      supertest(app)
        .get(paths.selfCreateService.otpVerify)
        .expect(400)
        .end(done)
    })
  })

  describe('post to OTP verify page', function () {
    it('should redirect to proceed-to-login page when user submits valid otp code', function (done) {
      const mockConnectorCreateGatewayAccountResponse =
        gatewayAccountFixtures.validGatewayAccountResponse({
          gateway_account_id: gatewayAccountId
        })
      const mockAdminUsersInviteCompleteRequest =
        inviteFixtures.validInviteCompleteRequest()
      const mockAdminUsersInviteCompleteResponse =
        inviteFixtures.validInviteCompleteResponse({
          invite: {
            code: inviteCode,
            type: 'service',
            disabled: true
          },
          user_external_id: userExternalId,
          service_external_id: serviceExternalId
        })
      const getUserResponse = userFixtures.validUserResponse({ external_id: userExternalId })

      connectorMock.post(CONNECTOR_ACCOUNTS_URL)
        .reply(201, mockConnectorCreateGatewayAccountResponse)
      adminusersMock.post(`${ADMINUSERS_INVITES_URL}/${inviteCode}/complete`, mockAdminUsersInviteCompleteRequest)
        .reply(200, mockAdminUsersInviteCompleteResponse)
      adminusersMock.get(`/v1/api/users/${userExternalId}`)
        .reply(200, getUserResponse)
      adminusersMock.patch(`/v1/api/services/${serviceExternalId}`)
        .reply(200, {})

      const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest({
        code: inviteCode
      })
      adminusersMock.post(`${INVITE_OTP_RESOURCE}`, validServiceInviteOtpRequest)
        .reply(200)

      app = session.getAppWithRegisterInvitesCookie(getApp(), {
        code: inviteCode,
        telephone_number: '07700900000',
        email: 'test@test.test'
      })
      supertest(app)
        .post(paths.selfCreateService.otpVerify)
        .send({
          'verify-code': validServiceInviteOtpRequest.otp,
          csrfToken: csrf().create('123')
        })
        .expect(303)
        .expect('Location', paths.selfCreateService.logUserIn)
        .end(done)
    })

    it('should return error when register_invite cookie not present', function (done) {
      const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest()

      app = session.getAppWithLoggedOutSession(getApp())
      supertest(app)
        .post(paths.selfCreateService.otpVerify)
        .send({
          code: validServiceInviteOtpRequest.code,
          'verify-code': validServiceInviteOtpRequest.otp,
          csrfToken: csrf().create('123')
        })
        .expect(400)
        .end(done)
    })

    it('should redirect to verify OTP page on verification code with incorrect format', function (done) {
      const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest()
      const registerInviteData = {
        code: validServiceInviteOtpRequest.code,
        email: 'bob@bob.com'
      }
      app = session.getAppWithRegisterInvitesCookie(getApp(), registerInviteData)
      supertest(app)
        .post(paths.selfCreateService.otpVerify)
        .send({
          code: validServiceInviteOtpRequest.code,
          'verify-code': 'abc',
          csrfToken: csrf().create('123')
        })
        .expect(303)
        .expect('Location', paths.selfCreateService.otpVerify)
        .expect(() => {
          expect(registerInviteData).to.have.property('recovered').to.deep.equal({
            errors: {
              verificationCode: 'Enter numbers only'
            }
          })
        })
        .end(done)
    })

    it('should redirect to verify OTP page on invalid otp code', function (done) {
      const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest()
      const registerInviteData = {
        code: validServiceInviteOtpRequest.code,
        email: 'bob@bob.com'
      }
      adminusersMock.post(`${INVITE_OTP_RESOURCE}`, validServiceInviteOtpRequest)
        .reply(401)
      app = session.getAppWithRegisterInvitesCookie(getApp(), registerInviteData)
      supertest(app)
        .post(paths.selfCreateService.otpVerify)
        .send({
          code: validServiceInviteOtpRequest.code,
          'verify-code': validServiceInviteOtpRequest.otp,
          csrfToken: csrf().create('123')
        })
        .expect(303)
        .expect('Location', paths.selfCreateService.otpVerify)
        .expect(() => {
          expect(registerInviteData).to.have.property('recovered').to.deep.equal({
            errors: {
              verificationCode: 'The verification code you’ve used is incorrect or has expired'
            }
          })
        })
        .end(done)
    })

    it('should error if invite code is not found', function (done) {
      const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest()
      const registerInviteData = {
        code: validServiceInviteOtpRequest.code,
        email: 'bob@bob.com'
      }

      adminusersMock.post(`${INVITE_OTP_RESOURCE}`, validServiceInviteOtpRequest)
        .reply(400)

      app = session.getAppWithRegisterInvitesCookie(getApp(), registerInviteData)

      supertest(app)
        .post(paths.selfCreateService.otpVerify)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          code: validServiceInviteOtpRequest.code,
          'verify-code': validServiceInviteOtpRequest.otp,
          csrfToken: csrf().create('123')
        })
        .expect(500)
        .expect((res) => {
          expect(res.body.message).to.equal('There is a problem with the payments platform. Please contact the support team.')
        })
        .end(done)
    })

    it('should error if invite code is no longer valid (expired)', function (done) {
      const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest()
      const registerInviteData = {
        code: validServiceInviteOtpRequest.code,
        email: 'bob@bob.com'
      }

      adminusersMock.post(`${INVITE_OTP_RESOURCE}`, validServiceInviteOtpRequest)
        .reply(410)

      app = session.getAppWithRegisterInvitesCookie(getApp(), registerInviteData)

      supertest(app)
        .post(paths.selfCreateService.otpVerify)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          code: validServiceInviteOtpRequest.code,
          'verify-code': validServiceInviteOtpRequest.otp,
          csrfToken: csrf().create('123')
        })
        .expect(410)
        .expect((res) => {
          expect(res.body.message).to.equal('This invitation is no longer valid')
        })
        .end(done)
    })
  })
})
