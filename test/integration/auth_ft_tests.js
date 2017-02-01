require(__dirname + '/../test_helpers/serialize_mock.js');
var request = require('supertest');
var auth = require(__dirname + '/../../app/services/auth_service.js');
var login = require(__dirname + '/../../app/controllers/login_controller.js');
var express = require('express');
var mockSession = require(__dirname + '/../test_helpers/mock_session.js');
var getAppWithSession = mockSession.getAppWithSession;
var getAppWithLoggedInUser = mockSession.getAppWithLoggedInUser;

var paths = require(__dirname + '/../../app/paths.js');
var path = require('path');

describe('An endpoint not protected', function () {
  var app = express();
  auth.initialise(app);
  var withNoSession = getAppWithSession(app, {});

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
    let user = mockSession.getUser();

    request(getAppWithLoggedInUser(app, user))
      .get('/unprotected')
      .expect(200)
      .expect('Hello, World!')
      .end(done);
  });
});

describe('An endpoint protected by auth.enforceUserBothFactors', function () {
  var app = express();
  auth.initialise(app);
  var withNoSession = getAppWithSession(app,{});

  app.get('/protected', auth.enforceUserAuthenticated, function (req, res) {
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
    let user = mockSession.getUser();
    request(getAppWithLoggedInUser(app, user))
      .get('/protected')
      .expect(200)
      .expect('Hello, World!')
      .end(done);
  });

  it('redirects if not second factor loggedin', function (done) {
    let user = mockSession.getUser();

    request(mockSession.getAppWithSessionWithoutSecondFactor(app, user))
      .get('/protected')
      .expect(302)
      .expect('Location', paths.user.otpLogIn)
      .end(done);
  });


  it('redirects to noaccess if no account_id', function (done) {
    let user = mockSession.getUser();
    user.gatewayAccountId = null;
    request(getAppWithLoggedInUser(app, user))
      .get('/protected')
      .expect(302)
      .expect('Location', paths.user.noAccess)
      .end(done);
  });
});
