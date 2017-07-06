'use strict';

const nock = require('nock');
const session = require('../../test_helpers/mock_session');
const getApp = require('../../../server').getApp;
const csrf = require('csrf');
const supertest = require('supertest');
const inviteFixtures = require('../../fixtures/invite_fixtures');
const paths = require('../../../app/paths');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const adminusersMock = nock(process.env.ADMINUSERS_URL);
const SERVICE_INVITE_RESOURCE = '/v1/api/invites/service';
const SERVICE_INVITE_OTP_RESOURCE = '/v1/api/invites/otp/validate/service';

let app;
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('create service otp validation', function () {

  afterEach((done) => {
    nock.cleanAll();
    app = null;
    done();
  });

  it('should redirect to verify otp page on invalid otp code', function (done) {
    const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest();
    const registerInviteData = {
      code: validServiceInviteOtpRequest.getPlain().code
    };

    adminusersMock.post(`${SERVICE_INVITE_OTP_RESOURCE}`, validServiceInviteOtpRequest.getPlain())
      .reply(401);

    app = session.getAppWithRegisterInvitesCookie(getApp(), registerInviteData);
    supertest(app)
      .post('/create-service/verify-otp')
      .send({
        code: validServiceInviteOtpRequest.getPlain().code,
        'verify-code': validServiceInviteOtpRequest.getPlain().otp,
        csrfToken: csrf().create('123'),
      })
      .expect(303)
      .expect('Location', paths.selfCreateService.otpVerify)
      .end(done);
  });

  it('should error if invite code is not found', function (done) {
    const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest();
    const registerInviteData = {
      code: validServiceInviteOtpRequest.getPlain().code
    };

    adminusersMock.post(`${SERVICE_INVITE_OTP_RESOURCE}`, validServiceInviteOtpRequest.getPlain())
      .reply(404);

    app = session.getAppWithRegisterInvitesCookie(getApp(), registerInviteData);

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
        expect(res.body.message).to.equal('Unable to process registration at this time');
      })
      .end(done);
  });

  it('should error if invite code is no longer valid (expired)', function (done) {
    const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest();
    const registerInviteData = {
      code: validServiceInviteOtpRequest.getPlain().code
    };

    adminusersMock.post(`${SERVICE_INVITE_OTP_RESOURCE}`, validServiceInviteOtpRequest.getPlain())
      .reply(410);

    app = session.getAppWithRegisterInvitesCookie(getApp(), registerInviteData);

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
        expect(res.body.message).to.equal('This invitation is no longer valid');
      })
      .end(done);
  });
});
