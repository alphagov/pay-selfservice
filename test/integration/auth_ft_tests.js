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
var server = require(__dirname + '/../../server.js');

var app;

function addUnprotectedEndpointToApp(app) {
  app.get('/unprotected', function (req, res) {
    res.send('Hello, World!');
  });
}

function addProtectedEndpointToApp(app) {
  app.get('/protected', auth.enforceUserAuthenticated, function (req, res) {
    res.send('Hello, World!');
  });
}

describe('An endpoint not protected', function () {

  afterEach(function () {
    app = null;
  });


  it('allows access if not authenticated', function (done) {
    app = getAppWithSession(server.getApp(), {});
    addUnprotectedEndpointToApp(app);
    request(app)
      .get('/unprotected')
      .expect(200)
      .expect('Hello, World!')
      .end(done);
  });

  it('allows access if authenticated', function (done) {
    let user = mockSession.getUser();
    app = getAppWithLoggedInUser(server.getApp(), user);
    addUnprotectedEndpointToApp(app);
    request(app)
      .get('/unprotected')
      .expect(200)
      .expect('Hello, World!')
      .end(done);
  });
});

describe('An endpoint protected by auth.enforceUserBothFactors', function () {

  afterEach(function () {
    app = null;
  });

  it('redirects to /login if not authenticated', function (done) {
    app = getAppWithSession(server.getApp(), {});
    addProtectedEndpointToApp(app);


    request(app)
      .get('/protected')
      .expect(302)
      .expect('Location', paths.user.logIn)
      .end(done);
  });

  it('allows access if authenticated', function (done) {
    let user = mockSession.getUser();

    app = getAppWithLoggedInUser(server.getApp(), user);
    addProtectedEndpointToApp(app);

    request(app)
      .get('/protected')
      .expect(200)
      .expect('Hello, World!')
      .end(done);
  });

  it('redirects if not second factor loggedin', function (done) {
    let user = mockSession.getUser();

    app = mockSession.getAppWithSessionWithoutSecondFactor(server.getApp(), user);
    addProtectedEndpointToApp(app);

    request(app)
      .get('/protected')
      .expect(302)
      .expect('Location', paths.user.otpLogIn)
      .end(done);
  });


  it('redirects to noaccess if no account_id', function (done) {
    let user = mockSession.getUser();
    user.gatewayAccountId = null;

    app = getAppWithLoggedInUser(server.getApp(), user);
    addProtectedEndpointToApp(app);

    request(app)
      .get('/protected')
      .expect(302)
      .expect('Location', paths.user.noAccess)
      .end(done);
  });
});
