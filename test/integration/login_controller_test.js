var dbMock      = require(__dirname + '/../test_helpers/db_mock.js');
var request     = require('supertest');
var _app        = require(__dirname + '/../../server.js').getApp;
var winston     = require('winston');
var nock        = require('nock');
var csrf        = require('csrf');
var assert      = require('assert');
var should      = require('chai').should();
var paths       = require(__dirname + '/../../app/paths.js');
var session     = require(__dirname + '/../test_helpers/mock_session.js');
var ACCOUNT_ID  = 182364;
var login_controller     = require(__dirname + '/../../app/controllers/login_controller.js');
var proxyquire  = require('proxyquire');
var q           = require('q');
var notp        = require('notp');


var app = session.getAppWithLoggedInSession(_app, ACCOUNT_ID);
var user = session.user;

describe('The logged in endpoint', function () {
  it('should render ok when logged in',function(done){
    request(app)
      .get("/")
      .expect(200)
      .expect(function(res){ assert(res.text.indexOf(user.username) !== -1); })
      .end(done);
  });


  it('should redirecect to login if not logged in',function(done){
    var app2 = session.getAppWithLoggedOutSession(_app, {});
    request(app2)
      .get("/")
      .expect(302)
      .expect('Location', "/login")
      .end(done);
  });

  it('should redirecect to otp login if no otp',function(done){
    var app2 = session.getAppWithLoggedOutSession(_app, {
      passport: {
        user: {
          gateway_account_id: 123,
          username: "username123"
        }
      }
    });
    request(app2)
      .get("/")
      .expect(302)
      .expect('Location', "/otp-login")
      .end(done);
  });
});


describe('The logout endpoint', function () {
  it('should redirect to login',function(done){
    request(app)
      .get("/logout")
      .expect(302)
      .expect('Location', "/login")
      .end(done);
  });

  it("should handle case where session expired", (done) => {
    request(_app)
      .get("/logout")
      .expect(302)
      .expect('Location', "/login")
      .end(done);
  });
});


describe('The postlogin endpoint', function () {
  it('should redirect to root ',function(done){
    // happens after the passort middleware, so cant test through supertest
    var passes = false,
    expectedUrl = paths.user.otpLogIn,
    req = {
      session: { save: (cb)=> cb()},
      headers: {'x-request-id': 'some-unique-id' },
      user: { resetLoginCount: ()=> {
        return { then: (cb,failCb)=> cb()  }
        }
      }
    },
    res = {
      redirect: function(redirect){
        if (redirect == expectedUrl) passes = true;
    }};
    login_controller.postLogin(req, res);
    assert(passes);
    done();
  });
});


describe('The otplogin endpoint', function () {
  it('should render and send key on firt time',function(done){
    var ses =  session.getMockAccount(ACCOUNT_ID);
    delete ses.passport.user.otp_key;
    callsSendOTP = false;
    ses.passport.user.sendOTP = function(){
      return { then: function(callback){
        callsSendOTP = !!true;
        callback();
      }};
    };


    var app2 = session.getAppWithLoggedOutSession(_app,ses);
     request(app2)
      .get("/otp-login")
      .expect(200)
      .end(function(){
        assert(callsSendOTP);
        assert(ses.sentCode === true);
        done();
      });
  });

  it('should render and not send key on seccond time',function(done){
    var ses =  session.getMockAccount(ACCOUNT_ID);
    delete ses.passport.user.otp_key;
    doesNotcallSendOTP = true;
    ses.sentCode = true;
    ses.passport.user.sendOTP = function(){
      return { then: function(callback){
        doesNotcallSendOTP = false;
        callback();
      }};
    };


    var app2 = session.getAppWithLoggedOutSession(_app,ses);
     request(app2)
      .get("/otp-login")
      .expect(200)
      .end(function(){
        assert(doesNotcallSendOTP);
        done();
      });
  });

  it('should redirect to login to the last url',function(done){
    // happens after the passort middleware, so cant test through supertest
    var passes = false,
    url = "http://foo",
    req = {session: {
      last_url: url, save: (cb)=> cb() },
      headers: {'x-request-id': 'some-unique-id' },
      user: { resetLoginCount: ()=> {
        return { then: (cb,failCb)=> cb()  }
        }
      }
    },
    res = {
      redirect: function(redirect){
        if (redirect == url) passes = true;
    }};
    login_controller.afterOTPLogin(req, res);
    assert(passes);
    done();
  });
});


describe('The afterOtpLogin endpoint', function () {
  it('should redirect to root',function(done){
    var passes = false,
    url = "/",
    req = {
      session: { save: (cb)=> cb() },
      headers: {'x-request-id': 'some-unique-id' },
      user: { resetLoginCount: ()=> {
        return { then: (cb,failCb)=> cb()  }
        }
      }
    },
    res = {
      redirect: function(redirect){
        if (redirect == url && req.session.secondFactor == 'totp') passes = true;
    }};
    login_controller.afterOTPLogin(req, res);
    assert(passes);
    done();
  });
});


describe('login post enpoint',function(){
  it('should display an error if csrf token does not exist for the login post', function (done) {
    request(app)
    .post(paths.user.logIn)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({})
    .expect(200, { message: "There is a problem with the payments platform"})
    .end(done);
  });
});

describe('otp login post enpoint',function(){
  it('should display an error if csrf token does not exist for the login post', function (done) {
  var app2 = session.getAppWithLoggedOutSession(_app, {
    secondFactor: "totp",
    passport: {
      user: {
        gateway_account_id: 123,
        username: "username123",
        otp_key: "12345"
      }
    }
  });

    request(app2)
    .post(paths.user.otpLogIn)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({code: notp.totp.gen("12345")})
    .expect(200, { message: "There is a problem with the payments platform"})
    .end(done);
  });
});


describe('otp send again post enpoint',function(){
  it('should display an error if csrf token does not exist for the send again post', function (done) {
  var app2 = session.getAppWithLoggedOutSession(_app, {
    secondFactor: "totp",
    passport: {
      user: {
        gateway_account_id: 123,
        username: "username123",
        otp_key: "12345"
      }
    }
  });

    request(app2)
    .post(paths.user.otpSendAgain)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({})
    .expect(200, { message: "There is a problem with the payments platform"})
    .end(done);
  });
});
