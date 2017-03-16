require(__dirname + '/../test_helpers/serialize_mock.js');
var request = require('supertest');
var getApp = require(__dirname + '/../../server.js').getApp;
var nock = require('nock');
var assert = require('assert');
var notp = require('notp');
var chai = require('chai');
var _ = require('lodash');

var paths = require(__dirname + '/../../app/paths.js');
var mock_session = require(__dirname + '/../test_helpers/mock_session.js');
var login_controller = require(__dirname + '/../../app/controllers/login_controller.js');
createGovukNotifyToken = require('../test_helpers/jwt');
var mockRes = require('../fixtures/response');

var should = chai.should();
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

var adminusersMock = nock(process.env.ADMINUSERS_URL);
var ACCOUNT_ID = 182364;
const USER_RESOURCE = '/v1/api/users';

var user = mock_session.getUser({gateway_account_id: ACCOUNT_ID});

describe('The logged in endpoint', function () {

  it('should render ok when logged in', function (done) {
    var app = mock_session.getAppWithLoggedInUser(getApp(), user);
    request(app)
      .get("/")
      .expect(200)
      .expect(function (res) {
        assert(res.text.indexOf(user.username) !== -1);
      })
      .end(done);
  });


  it('should redirecect to login if not logged in', function (done) {
    var app = mock_session.getAppWithSessionAndGatewayAccountCookies(getApp(), {});
    request(app)
      .get("/")
      .expect(302)
      .expect('Location', "/login")
      .end(done);
  });

  it('should redirecect to otp login if no otp', function (done) {
    var app = mock_session.getAppWithSessionWithoutSecondFactor(getApp(), mock_session.getUser({gateway_account_ids: [ACCOUNT_ID]}));
    request(app)
      .get("/")
      .expect(302)
      .expect('Location', "/otp-login")
      .end(done);
  });
});


describe('The logout endpoint', function () {

  it('should redirect to login', function (done) {
    var app = mock_session.getAppWithSessionAndGatewayAccountCookies(getApp(), {});
    request(app)
      .get("/logout")
      .expect(302)
      .expect('Location', "/login")
      .end(done);
  });

  it("should handle case where mock_session expired", (done) => {
    request(getApp())
      .get("/logout")
      .expect(302)
      .expect('Location', "/login")
      .end(done);
  });
});


describe('The postlogin endpoint', function () {
  it('should redirect to root and clean mock_session of all but passport,currentGatewayAccountId  and last_url', function (done) {
    // happens after the passort middleware, so cant test through supertest
    var user = mock_session.getUser();
    var session = mock_session.getMockSession(user),
      expectedUrl = paths.user.otpLogIn,
      req = {
        session: _.merge(session, {currentGatewayAccountId: '13'}),
        headers: {'x-request-id': 'some-unique-id'},
        user: user
      },
      res = mockRes.getStubbedRes();

    adminusersMock.post(`${USER_RESOURCE}/${user.username}/attempt-login?action=reset`)
      .reply(200);

    login_controller.postLogin(req, res);
    expect(res.redirect.calledWith(expectedUrl)).to.equal(true);
    expect(req.session).to.deep.equal({
      passport: session.passport,
      last_url: session.last_url,
      currentGatewayAccountId: '13'
    });
    done();
  });
});


describe('The otplogin endpoint', function () {
  afterEach(() => {
    nock.cleanAll();
  });


  it('should render and send key on first time', function (done) {
    var user = mock_session.getUser();

    var sessionData = {
      csrfSecret: "123",
      passport: {
        user: user,
      }
    };

    adminusersMock.post(`${USER_RESOURCE}/${user.username}/second-factor/`)
      .reply(200);

    var app = mock_session.getAppWithSessionAndGatewayAccountCookies(getApp(), sessionData);
    request(app)
      .get("/otp-login")
      .expect(200)
      .end(function () {
        assert(sessionData.sentCode === true);
        done();
      });
  });

  it('should render and not send key on seccond time', function (done) {
    var user = mock_session.getUser();

    var sessionData = {
      csrfSecret: "123",
      passport: {
        user: user,
      },
      sentCode: true
    };

    var app = mock_session.getAppWithSessionAndGatewayAccountCookies(getApp(), sessionData);

    request(app)
      .get("/otp-login")
      .expect(200)
      .end(function () {
        done();
      });
  });

});


describe('The afterOtpLogin endpoint', function () {

  it('should redirect to login to the last url', function (done) {
    var user = mock_session.getUser();
    var session = mock_session.getMockSession(user),
      req = {
        session: session,
        headers: {'x-request-id': 'some-unique-id'},
        user: user
      },
      lastUrl = session.last_url,
      res = mockRes.getStubbedRes();

    login_controller.afterOTPLogin(req, res);
    expect(res.redirect.calledWith(lastUrl)).to.equal(true);
    done();
  });

  it('should redirect to root if lasturl is not defined', function (done) {
    var user = mock_session.getUser();
    var session = mock_session.getMockSession(user);
    delete session.last_url;
    delete session.secondFactor;
    var req = {
        session: session,
        headers: {'x-request-id': 'some-unique-id'},
        user: user
      },
      res = mockRes.getStubbedRes();

    login_controller.afterOTPLogin(req, res);
    expect(res.redirect.calledWith('/')).to.equal(true);
    expect(req.session.secondFactor == 'totp');
    done();

  });
});


describe('login post endpoint', function () {
  it('should display an error if csrf token does not exist for the login post', function (done) {
    request(getApp())
      .post(paths.user.logIn)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({})
      .expect(200, {message: "There is a problem with the payments platform"})
      .end(done);
  });
});

describe('otp login post enpoint', function () {
  it('should display an error if csrf token does not exist for the login post', function (done) {

    var user = mock_session.getUser();
    var session = mock_session.getMockSession(user);
    delete session.csrfSecret;

    var app2 = mock_session.getAppWithSessionAndGatewayAccountCookies(getApp(), session);

    request(app2)
      .post(paths.user.otpLogIn)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({code: notp.totp.gen("12345")})
      .expect(200, {message: "There is a problem with the payments platform"})
      .end(done);
  });
});


describe('otp send again post enpoint', function () {
  it('should display an error if csrf token does not exist for the send again post', function (done) {

    var user = mock_session.getUser();
    var session = mock_session.getMockSession(user);
    delete session.csrfSecret;

    var app2 = mock_session.getAppWithSessionAndGatewayAccountCookies(getApp(), session);

    request(app2)
      .post(paths.user.otpSendAgain)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({})
      .expect(200, {message: "There is a problem with the payments platform"})
      .end(done);
  });
});
