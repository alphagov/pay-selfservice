var dbMock      = require(__dirname + '/../test_helpers/db_mock.js');
var realApp     = require(__dirname + '/../../server.js').getApp;
var request     = require('supertest');
var auth        = require(__dirname + '/../../app/services/auth_service.js');
var login       = require(__dirname + '/../../app/controllers/login_controller.js');
var session     = require('express-session');
var express     = require('express');
var mockSession = require(__dirname + '/../test_helpers/mock_session.js').mockSession;
var paths       = require(__dirname + '/../../app/paths.js');
var sequelize   = require(__dirname + '/../../app/utils/sequelize_config.js');
var path = require('path');

var valid_session = {
  passport: {
    user:  { email: "foo@bar.com", gateway_account_id: 123 }
  },
  secondFactor: 'totp'
};

var noOTPSession = {
  passport: {
    user: {
      gateway_account_id: 123
    }
  }
};

var session_no_account_id = {
  passport: {
    user: {
      name: 'Claire'
    }
  }
};




describe('An endpoint not protected', function () {
  var app = express();
  auth.initialise(app);
  var withNoSession = mockSession(app);

  app.get('/unprotected', function (req, res) {
    res.send('Hello, World!');
  });

  it('allows access if not authenticated', function (done) {
    request(withNoSession)
      .get('/unprotected')
      .expect(200)
      .expect('Hello, World!')
      .end(done);
  });

  it('allows access if authenticated', function (done) {
    request(mockSession(app, valid_session))
      .get('/unprotected')
      .expect(200)
      .expect('Hello, World!')
      .end(done);
  });
});

describe('An endpoint protected by auth.enforceUserBothFactors', function () {


  var app = express();
  auth.initialise(app);
  var withNoSession = mockSession(app);

  app.get('/protected', auth.enforceUserBothFactors, function (req, res) {
    res.send('Hello, World!');
  });

  it('redirects to /login if not authenticated', function (done) {
    request(withNoSession)
      .get('/protected')
      .expect(302)
      .expect('Location', paths.user.logIn)
      .end(done);
  });

  it('allows access if authenticated', function (done) {

    request(mockSession(app, valid_session))
      .get('/protected')
      .expect(200)
      .expect('Hello, World!')
      .end(done);
  });

  it('redirects if not second factor loggedin', function (done) {
    request(mockSession(app, noOTPSession))
      .get('/protected')
      .expect(302)
      .expect('Location', paths.user.otpLogIn)
      .end(done);
  });


  it('redirects to noaccess if no account_id', function (done) {
    request(mockSession(app, session_no_account_id))
      .get('/protected')
      .expect(302)
      .expect('Location', paths.user.noAccess)
      .end(done);
  });

  it('allows access if authenticated', function (done) {
    request(mockSession(app, valid_session))
      .get('/protected')
      .expect(200)
      .expect('Hello, World!')
      .end(done);
  });

  it('redirects to noaccess if no account_id', function (done) {
    request(mockSession(app, session_no_account_id))
      .get('/protected')
      .expect(302)
      .expect('Location', paths.user.noAccess)
      .end(done);
  });
});

