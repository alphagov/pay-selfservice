let nock = require('nock');
var proxyquire = require('proxyquire');
const reqFixtures = require(__dirname + '/../fixtures/browser/forgotten_password_fixtures');
const resFixtures = require(__dirname + '/../fixtures/response');
const userFixtures = require(__dirname + '/../fixtures/user_fixtures');
const notifyFixture = require(__dirname + '/../fixtures/notify');

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

let alwaysValidPassword = function (password) {
  return false; // common-password returns false if password is not one of the common passwords (which would be invalid)
};

let userService = function (commonPasswordMock) {
  return proxyquire(__dirname + '/../../app/services/user_service.js', {
    'common-password': commonPasswordMock || alwaysValidPassword
  });
};

let forgottenPassword = function (commonPasswordMock) {
  return proxyquire(__dirname + '/../../app/controllers/forgotten_password_controller.js', {
    '../services/user_service.js': userService(commonPasswordMock)
  });
};


let adminusersMock = nock(process.env.ADMINUSERS_URL);
const USER_RESOURCE = '/v1/api/users';
const FORGOTTEN_PASSWORD_RESOURCE = '/v1/api/forgotten-passwords';
const RESET_PASSWORD_RESOURCE = '/v1/api/reset-password';

describe('forgotten_password_controller', function () {

  let forgottenPasswordController = forgottenPassword();

  afterEach((done) => {
    nock.cleanAll();
    done();
  });

  it('send email upon valid forgotten password reset request', function (done) {
    let req = reqFixtures.validForgottenPasswordPost();
    let res = resFixtures.getStubbedRes();
    let username = req.body.username;
    let userResponse = userFixtures.validUserResponse({username: username});
    let forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({username: username});

    adminusersMock.get(`${USER_RESOURCE}/${username}`)
      .reply(200, userResponse.getPlain());

    adminusersMock.post(FORGOTTEN_PASSWORD_RESOURCE, userFixtures
      .validForgottenPasswordCreateRequest(username)
      .getPlain())
      .reply(200, forgottenPasswordResponse.getPlain());

    notifyFixture.mockSendForgottenPasswordEmail(
      userResponse.getPlain().email,
      forgottenPasswordResponse.getPlain().code);

    forgottenPasswordController.emailPost(req, res).should.be.fulfilled
      .then((user) => {
        expect(user).to.deep.equal(userResponse.getAsObject());
        expect(res.redirect.called).to.equal(true);
      }).should.notify(done);
  });

  it('display new password capture form', function (done) {
    let req = reqFixtures.validForgottenPasswordGet();
    let res = resFixtures.getStubbedRes();
    let token = req.params.id;
    let forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({code: token});

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse.getPlain());

    forgottenPasswordController.newPasswordGet(req, res).should.be.fulfilled
      .then(() => {
        expect(res.render.calledWith('forgotten_password/new_password', {id: token})).to.equal(true);
      }).should.notify(done);
  });

  it('display error view if token not found/expired', function (done) {
    let req = reqFixtures.validForgottenPasswordGet();
    let res = resFixtures.getStubbedRes();
    let token = req.params.id;

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(404);

    forgottenPasswordController.newPasswordGet(req, res).should.be.fulfilled
      .then(() => {
        expect(req.flash.calledWith('genericError', 'Invalid password reset link')).to.equal(true);
        expect(res.redirect.calledWith('/login')).to.equal(true);
      }).should.notify(done);
  });

  it('reset users password upon valid reset password request', function (done) {
    let req = reqFixtures.validUpdatePasswordPost();
    let res = resFixtures.getStubbedRes();
    let username = req.body.username;
    let userResponse = userFixtures.validUserResponse({username: username});
    let token = req.params.id;
    let forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({username: username, code: token});

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse.getPlain());

    adminusersMock.get(`${USER_RESOURCE}/${username}`)
      .reply(200, userResponse.getPlain());

    adminusersMock.post(RESET_PASSWORD_RESOURCE, userFixtures
      .validUpdatePasswordRequest(token, req.body.password)
      .getPlain())
      .reply(204);

    adminusersMock.patch(`${USER_RESOURCE}/${username}`, userFixtures
      .validIncrementSessionVersionRequest()
      .getPlain())
      .reply(200);

    forgottenPasswordController.newPasswordPost(req, res).should.be.fulfilled
      .then(() => {
        expect(req.session.destroy.called).to.equal(true);
        expect(req.flash.calledWith('generic', 'Password has been updated')).to.equal(true);
        expect(res.redirect.calledWith('/login')).to.equal(true);
      }).should.notify(done);
  });

  it('error if password is too short', function (done) {
    let req = reqFixtures.validUpdatePasswordPost();
    let res = resFixtures.getStubbedRes();
    let username = req.body.username;
    req.body.password = 'short';
    let userResponse = userFixtures.validUserResponse({username: username});
    let token = req.params.id;
    let forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({username: username, code: token});

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse.getPlain());

    adminusersMock.get(`${USER_RESOURCE}/${username}`)
      .reply(200, userResponse.getPlain());

    forgottenPasswordController.newPasswordPost(req, res).should.be.fulfilled
      .then(() => {
        expect(req.flash.calledWith('genericError', 'Your password must be at least 10 characters.')).to.equal(true);
        expect(res.redirect.calledWith('/reset-password/' + token)).to.equal(true);
      }).should.notify(done);
  });

  it('error if password is one of the common passwords', function (done) {

    let aForgottenPasswordController = forgottenPassword(() => true);
    let req = reqFixtures.validUpdatePasswordPost();
    let res = resFixtures.getStubbedRes();
    let username = req.body.username;
    req.body.password = "common password";
    let userResponse = userFixtures.validUserResponse({username: username});
    let token = req.params.id;
    let forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({username: username, code: token});

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse.getPlain());

    adminusersMock.get(`${USER_RESOURCE}/${username}`)
      .reply(200, userResponse.getPlain());

    aForgottenPasswordController.newPasswordPost(req, res).should.be.fulfilled
      .then(() => {
        expect(req.flash.calledWith('genericError', 'Your password is too simple. Choose a password that is harder for people to guess.')).to.equal(true);
        expect(res.redirect.calledWith('/reset-password/' + token)).to.equal(true);
      }).should.notify(done);
  });

  it('error if unknown error returns from adminusers', function (done) {
    let req = reqFixtures.validUpdatePasswordPost();
    let res = resFixtures.getStubbedRes();
    let username = req.body.username;
    let userResponse = userFixtures.validUserResponse({username: username});
    let token = req.params.id;
    let forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({username: username, code: token});

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse.getPlain());

    adminusersMock.get(`${USER_RESOURCE}/${username}`)
      .reply(200, userResponse.getPlain());

    adminusersMock.post(RESET_PASSWORD_RESOURCE, userFixtures
      .validUpdatePasswordRequest(token, req.body.password)
      .getPlain())
      .reply(500);

    forgottenPasswordController.newPasswordPost(req, res).should.be.fulfilled
      .then(() => {
        expect(req.flash.calledWith('genericError', 'There has been a problem updating password.')).to.equal(true);
        expect(res.redirect.calledWith('/reset-password/' + token)).to.equal(true);
      }).should.notify(done);
  });

});
