'use strict'

// NPM dependencies
const nock = require('nock')
const csrf = require('csrf')
const supertest = require('supertest')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const session = require('../../test_helpers/mock_session')
const getApp = require('../../../server').getApp
const inviteFixtures = require('../../fixtures/invite_fixtures')
const gatewayAccountFixtures = require('../../fixtures/gateway_account_fixtures')
const paths = require('../../../app/paths')

// Constants
const SERVICE_INVITE_OTP_RESOURCE = '/v1/api/invites/otp/validate/service'
const CONNECTOR_ACCOUNTS_URL = '/v1/api/accounts'
const ADMINUSERS_INVITES_URL = '/v1/api/invites'
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const connectorMock = nock(process.env.CONNECTOR_URL)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

let app

describe('create service otp validation', function () {

  afterEach((done) => {
    nock.cleanAll()
    app = null
    done()
  })

  describe('get otp verify page', function () {
    it('should return an error when register_invite cookie not present', function (done) {
      app = session.getAppWithLoggedOutSession(getApp())
      supertest(app)
        .get(paths.selfCreateService.otpVerify)
        .expect(404)
        .end(done)
    })
  })

  describe('post to otp verify page', function () {
    it('should redirect to proceed-to-login page when user submits valid otp code', function (done) {
      const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'
      const userExternalId = 'f84b8210f93d455e97baeaf3fea72cf4'
      const serviceExternalId = '43a6818b522b4a628a14355614665ca3'
      const gatewayAccountId = '1'

      const mockConnectorCreateGatewayAccountResponse =
        gatewayAccountFixtures.validCreateGatewayAccountResponse({
          gateway_account_id: gatewayAccountId
        }).getPlain()
      const mockAdminUsersInviteCompleteRequest =
        inviteFixtures.validInviteCompleteRequest({
          gateway_account_ids: [gatewayAccountId]
        }).getPlain()
      const mockAdminUsersInviteCompleteResponse =
        inviteFixtures.validInviteCompleteResponse({
          invite: {
            code: inviteCode,
            type: 'service',
            disabled: true
          },
          user_external_id: userExternalId,
          service_external_id: serviceExternalId
        }).getPlain()

      connectorMock.post(CONNECTOR_ACCOUNTS_URL)
        .reply(201, mockConnectorCreateGatewayAccountResponse)
      adminusersMock.post(`${ADMINUSERS_INVITES_URL}/${inviteCode}/complete`, mockAdminUsersInviteCompleteRequest)
        .reply(200, mockAdminUsersInviteCompleteResponse)

      const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest({
        code: inviteCode
      })
      adminusersMock.post(`${SERVICE_INVITE_OTP_RESOURCE}`, validServiceInviteOtpRequest.getPlain())
        .reply(200)

      app = session.getAppWithRegisterInvitesCookie(getApp(), {
        code: inviteCode,
        telephone_number: '07451234567',
        email: 'bob@bob.com'
      })
      supertest(app)
        .post(paths.selfCreateService.otpVerify)
        .send({
          'verify-code': validServiceInviteOtpRequest.getPlain().otp,
          csrfToken: csrf().create('123'),
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
          code: validServiceInviteOtpRequest.getPlain().code,
          'verify-code': validServiceInviteOtpRequest.getPlain().otp,
          csrfToken: csrf().create('123'),
        })
        .expect(404)
        .end(done)
    })

    it('should redirect to verify otp page on invalid otp code', function (done) {
      const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest()
      const registerInviteData = {
        code: validServiceInviteOtpRequest.getPlain().code,
        email: 'bob@bob.com'
      }

      adminusersMock.post(`${SERVICE_INVITE_OTP_RESOURCE}`, validServiceInviteOtpRequest.getPlain())
        .reply(401)

      app = session.getAppWithRegisterInvitesCookie(getApp(), registerInviteData)
      supertest(app)
        .post(paths.selfCreateService.otpVerify)
        .send({
          code: validServiceInviteOtpRequest.getPlain().code,
          'verify-code': validServiceInviteOtpRequest.getPlain().otp,
          csrfToken: csrf().create('123'),
        })
        .expect(303)
        .expect('Location', paths.selfCreateService.otpVerify)
        .end(done)
    })

    it('should error if invite code is not found', function (done) {
      const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest()
      const registerInviteData = {
        code: validServiceInviteOtpRequest.getPlain().code,
        email: 'bob@bob.com'
      }

      adminusersMock.post(`${SERVICE_INVITE_OTP_RESOURCE}`, validServiceInviteOtpRequest.getPlain())
        .reply(404)

      app = session.getAppWithRegisterInvitesCookie(getApp(), registerInviteData)

      supertest(app)
        .post(paths.selfCreateService.otpVerify)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          code: validServiceInviteOtpRequest.getPlain().code,
          'verify-code': validServiceInviteOtpRequest.getPlain().otp,
          csrfToken: csrf().create('123')
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time')
        })
        .end(done)
    })

    it('should error if invite code is no longer valid (expired)', function (done) {
      const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest()
      const registerInviteData = {
        code: validServiceInviteOtpRequest.getPlain().code,
        email: 'bob@bob.com'
      }

      adminusersMock.post(`${SERVICE_INVITE_OTP_RESOURCE}`, validServiceInviteOtpRequest.getPlain())
        .reply(410)

      app = session.getAppWithRegisterInvitesCookie(getApp(), registerInviteData)

      supertest(app)
        .post(paths.selfCreateService.otpVerify)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          code: validServiceInviteOtpRequest.getPlain().code,
          'verify-code': validServiceInviteOtpRequest.getPlain().otp,
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
