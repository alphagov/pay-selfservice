let nock = require('nock');
let supertest = require('supertest');
let paths = require(__dirname + '/../../app/paths.js');
let getApp = require(__dirname + '/../../server.js').getApp;
let session = require(__dirname + '/../test_helpers/mock_session.js');
let inviteFixtures = require(__dirname + '/../fixtures/invite_fixtures');
let userFixtures = require(__dirname + '/../fixtures/user_fixtures');
let csrf = require('csrf');

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

let app;
let adminusersMock = nock(process.env.ADMINUSERS_URL);
let INVITE_RESOURCE_PATH = '/v1/api/invites';
const expect = chai.expect;
let mockRegisterAccountCookie;

describe('register user controller', function () {

  beforeEach((done) => {
    mockRegisterAccountCookie = {};
    app = session.getAppWithRegisterInvitesCookie(getApp(), mockRegisterAccountCookie);
    done();
  });

  afterEach((done) => {
    nock.cleanAll();
    app = null;
    done();
  });

  /**
   *  ENDPOINT validateInvite
   */
  describe('verify invitation endpoint', function () {

    it('should redirect to register view on a valid invite code', function (done) {

      let code = '23rer87t8shjkaf';
      let validInviteResponse = inviteFixtures.validInviteResponse().getPlain();

      adminusersMock.get(`${INVITE_RESOURCE_PATH}/${code}`)
        .reply(200, validInviteResponse);

      return supertest(app)
        .get(`/invites/${code}`)
        .set('x-request-id', 'bob')
        .expect(302)
        .expect('Location', paths.register.registration)
        .expect(() => {
          expect(mockRegisterAccountCookie.code).to.equal(code);
          expect(mockRegisterAccountCookie.email).to.equal(validInviteResponse.email);
        })
        .end(done);

    });

    it('should redirect to register with telephone number, if user did not complete previous attempt after entering registration details', function (done) {

      let code = '7s8ftgw76rwgu';
      let telephoneNumber = '123456789';
      let validInviteResponse = inviteFixtures.validInviteResponse({telephone_number: telephoneNumber}).getPlain();

      adminusersMock.get(`${INVITE_RESOURCE_PATH}/${code}`)
        .reply(200, validInviteResponse);

      return supertest(app)
        .get(`/invites/${code}`)
        .set('x-request-id', 'bob')
        .expect(302)
        .expect('Location', paths.register.registration)
        .expect(() => {
          expect(mockRegisterAccountCookie.code).to.equal(code);
          expect(mockRegisterAccountCookie.email).to.equal(validInviteResponse.email);
          expect(mockRegisterAccountCookie.telephone_number).to.equal(telephoneNumber);
        })
        .end(done);

    });

    it('should error if the invite code is invalid', function (done) {

      let invalidCode = 'invalidCode';
      adminusersMock.get(`${INVITE_RESOURCE_PATH}/${invalidCode}`)
        .reply(404);

      return supertest(app)
        .get(`/invites/${invalidCode}`)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time');
        })
        .end(done);

    });
  });


  /**
   *  ENDPOINT showRegistration
   */
  describe('show registration view endpoint', function () {

    it('should display create account form', function (done) {

      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';

      return supertest(app)
        .get(paths.register.registration)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(200)
        .expect((res) => {
          expect(res.body.email).to.equal('invitee@example.com');
        })
        .end(done);

    });

    it('should display create account form with telephone populated, if invite has been attempted', function (done) {

      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';
      mockRegisterAccountCookie.telephone_number = '123456789';

      return supertest(app)
        .get(paths.register.registration)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(200)
        .expect((res) => {
          expect(res.body.email).to.equal('invitee@example.com');
          expect(res.body.telephone_number).to.equal('123456789');
        })
        .end(done);

    });

    it('should display error when email and/or code is not in the cookie', function (done) {
      return supertest(app)
        .get(paths.register.registration)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time');
        })
        .end(done);
    });
  });

  /**
   *  ENDPOINT submitRegistration
   */

  describe('submit registration details endpoint', function () {

    it('should error if cookie details are missing', function (done) {

      return supertest(app)
        .post(paths.register.registration)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          csrfToken: csrf().create('123')
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time');
        })
        .end(done);

    });

    it('should redirect back to registration form if error in phone number', function (done) {

      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';

      let invalidPhone = '123456789';
      return supertest(app)
        .post(paths.register.registration)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': invalidPhone,
          'password': 'password1234',
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.register.registration)
        .expect((res) => {
          expect(mockRegisterAccountCookie.telephone_number).to.equal(invalidPhone);
        })
        .end(done);

    });

    it('should redirect to phone verification page', function (done) {

      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';

      adminusersMock.post(`${INVITE_RESOURCE_PATH}/otp/generate`)
        .reply(200);

      return supertest(app)
        .post(paths.register.registration)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': '12345678901',
          'password': 'password1234',
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.register.otpVerify)
        .end(done);

    });

    it('should error for valid registration data, if code not found', function (done) {

      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';

      adminusersMock.post(`${INVITE_RESOURCE_PATH}/otp/generate`)
        .reply(404);

      return supertest(app)
        .post(paths.register.registration)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': '12345678901',
          'password': 'password1234',
          csrfToken: csrf().create('123')
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time');
        })
        .end(done);

    });

  });

  /**
   *  ENDPOINT showOtpVerify
   */
  describe('show otp verify endpoint', function () {

    it('should error if cookie details are missing', function (done) {

      return supertest(app)
        .get(paths.register.otpVerify)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time');
        })
        .end(done);

    });

    it('should display verify otp page successfully', function (done) {

      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';

      return supertest(app)
        .get(paths.register.registration)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(200)
        .end(done);

    });
  });

  /**
   *  ENDPOINT submitOtpVerify
   */
  describe('validate otp code endpoint', function () {

    it('should validate otp code successfully', function (done) {
      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';
      let newUserExtId = 'new-user-ext-id';
      let validUserResponse = userFixtures.validUserResponse({external_id: newUserExtId}).getPlain();

      adminusersMock.post(`${INVITE_RESOURCE_PATH}/otp/validate`)
        .reply(201, validUserResponse);

      return supertest(app)
        .post(paths.register.otpVerify)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'verify-code': '123456',
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.register.logUserIn)
        .expect(() => {
          expect(mockRegisterAccountCookie.userExternalId).to.equal(newUserExtId);
        })
        .end(done);

    });

    it('should error if cookie details are missing', function (done) {

      return supertest(app)
        .post(paths.register.otpVerify)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'verify-code': '123456',
          csrfToken: csrf().create('123')
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time');
        })
        .end(done);
    });

    it('should error and allow user to reenter otp if invalid otp code entry', function (done) {

      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';

      return supertest(app)
        .post(paths.register.otpVerify)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'verify-code': 'hfwe67q', //non-numeric
          csrfToken: csrf().create('123')
        })
        .expect(303)
        .expect('Location', paths.register.otpVerify)
        .end(done);
    });

    it('should error if error during otp code verification', function (done) {

      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';

      adminusersMock.post(`${INVITE_RESOURCE_PATH}/otp/validate`)
        .reply(404);

      return supertest(app)
        .post(paths.register.otpVerify)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'verify-code': '123456',
          csrfToken: csrf().create('123')
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time');
        })
        .end(done);
    });
  });

  /**
   *  ENDPOINT showReVerifyPhone
   */
  describe('show re-verify phone endpoint', function () {

    it('should display re verify otp code form with pre-populated telephone number', function (done) {

      let telephoneNumber = '12345678901';

      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';
      mockRegisterAccountCookie.telephone_number = telephoneNumber;

      return supertest(app)
        .get(paths.register.reVerifyPhone)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(200)
        .expect((res) => {
          expect(res.body.telephone_number).to.equal(telephoneNumber);
        })
        .end(done);

    });

    it('should display error when email and/or code is not in the cookie', function (done) {
      return supertest(app)
        .get(paths.register.reVerifyPhone)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time');
        })
        .end(done);
    });
  });

  /**
   *  ENDPOINT submitReVerifyPhone
   */
  describe('submit re-verify phone endpoint', function () {

    it('should proceed to verify otp upon successful telephone number re-entry', function (done) {

      let telephoneNumber = '12345678901';

      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';

      adminusersMock.post(`${INVITE_RESOURCE_PATH}/otp/resend`)
        .reply(200);

      return supertest(app)
        .post(paths.register.reVerifyPhone)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': telephoneNumber,
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.register.otpVerify)
        .end(done);
    });

    it('should error on an error during resend otp', function (done) {

      let telephoneNumber = '12345678901';

      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';

      adminusersMock.post(`${INVITE_RESOURCE_PATH}/otp/resend`)
        .reply(404);

      return supertest(app)
        .post(paths.register.reVerifyPhone)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': telephoneNumber,
          csrfToken: csrf().create('123')
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time');
        })
        .end(done);
    });

    it('should redirect back to re verify phone view if error in phone number', function (done) {

      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';

      let invalidPhone = '123456789';

      return supertest(app)
        .post(paths.register.reVerifyPhone)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': invalidPhone,
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.register.reVerifyPhone)
        .expect((res) => {
          expect(mockRegisterAccountCookie.telephone_number).to.equal(invalidPhone);
        })
        .end(done);
    });

    it('should error if cookie details are missing', function (done) {
      let telephoneNumber = '12345678901';
      return supertest(app)
        .post(paths.register.reVerifyPhone)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': telephoneNumber,
          csrfToken: csrf().create('123')
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time');
        })
        .end(done);
    });

  });
});
