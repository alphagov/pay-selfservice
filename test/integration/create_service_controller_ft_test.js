'use strict';

const nock = require('nock');
const session = require(__dirname + '/../test_helpers/mock_session.js');
const getApp = require(__dirname + '/../../server.js').getApp;
const csrf = require('csrf');
const supertest = require('supertest');
const inviteFixtures = require(__dirname + '/../fixtures/invite_fixtures');
const paths = require(__dirname + '/../../app/paths.js');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const adminusersMock = nock(process.env.ADMINUSERS_URL);
const SERVICE_INVITE_OTP_RESOURCE = '/v1/api/invites/otp/validate/service';

let app;
chai.use(chaiAsPromised);

describe('create service otp validation', function () {

  afterEach((done) => {
    nock.cleanAll();
    app = null;
    done();
  });

  it('should return 200 on receiving valid otp', function (done) {
    const validServiceInviteOtpRequest = inviteFixtures.validVerifyOtpCodeRequest();

    adminusersMock.post(`${SERVICE_INVITE_OTP_RESOURCE}`, validServiceInviteOtpRequest.getPlain())
      .reply(200);

    app = session.getAppWithLoggedOutSession(getApp());
    return supertest(app)
      .post('/create-service/verify-otp')
      .send({
        code: validServiceInviteOtpRequest.getPlain().code,
        'verify-code': validServiceInviteOtpRequest.getPlain().otp,
        csrfToken: csrf().create('123'),
      })
      .expect(200)
      .end(done);
  });
});
