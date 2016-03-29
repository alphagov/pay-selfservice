// THESE ARE HERE TO SET GLOBAL ENV VARIABLES
process.env.AUTH0_URL = 'my.test.auth0';
process.env.AUTH0_CLIENT_ID = 'client12345';
process.env.AUTH0_CLIENT_SECRET = 'clientsupersecret';
process.env.DISABLE_INTERNAL_HTTPS = "true"; // to support other unit tests
process.env.SECURE_COOKIE_OFF="true";
process.env.COOKIE_MAX_AGE = "10800000";
process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk';


var request = require('supertest');
var auth = require(__dirname + '/../app/services/auth_service.js');
var should = require('chai').should();
var express = require('express');

var paths = require(__dirname + '/../app/paths.js');

//var valid_session = ['session=' + auth_cookie.create({
//  passport: { user: {
//    name: 'Michael',
//    _json:{
//      app_metadata: {
//        account_id: 123
//      }
//    }
//  }}
//})];
//
//var session_no_account_id = ['session=' + auth_cookie.create({
//  passport: { user: {
//    name: 'Claire'
//  }}
//})];
//
//describe('An endpoint not protected', function() {
//  var app = express();
//  auth.bind(app);
//  app.get('/unprotected', function (req, res) {
//    res.send('Hello, World!');
//  });
//
//  it('allows access if not authenticated', function(done) {
//    request(app)
//      .get('/unprotected')
//      .expect(200)
//      .expect('Hello, World!')
//      .end(done);
//  });
//
//  it('allows access if authenticated', function(done) {
//    request(app)
//      .get('/unprotected')
//      .set('Cookie', valid_session)
//      .expect(200)
//      .expect('Hello, World!')
//      .end(done);
//  });
//});
//
//describe('An endpoint protected by auth.enforce', function() {
//  var app = express();
//  auth.bind(app);
//  app.get('/protected', auth.enforce, function (req, res) {
//    res.send('Hello, World!');
//  });
//
//  it('redirects to /login if not authenticated', function(done) {
//    request(app)
//      .get('/protected')
//      .expect(302)
//      .expect('Location', paths.user.logIn)
//      .end(done);
//  });
//
//  it('allows access if authenticated', function(done) {
//    request(app)
//      .get('/protected')
//      .set('Cookie', valid_session)
//      .expect(200)
//      .expect('Hello, World!')
//      .end(done);
//  });
//
//  it('redirects to noaccess if no account_id', function(done) {
//    request(app)
//      .get('/protected')
//      .set('Cookie', session_no_account_id)
//      .expect(302)
//      .expect('Location', paths.user.noAccess)
//      .end(done);
//  });
//
//  it('stores the current url in session if not authed', function(done) {
//    request(app)
//      .get('/protected')
//      .expect(302)
//      .expect(function (res) {
//        var session = auth_cookie.decrypt(res);
//        should.equal(session.last_url, '/protected');
//      })
//      .end(done);
//  });
//
//  it('maintains url params of current url if not authed', function(done) {
//    request(app)
//      .get('/protected?foo=bar')
//      .expect(302)
//      .expect(function (res) {
//        var session = auth_cookie.decrypt(res);
//        should.equal(session.last_url, '/protected?foo=bar');
//      })
//      .end(done);
//  });
//});
//
//describe('An endpoint that enforces login', function(done) {
//  var app = express();
//  auth.bind(app);
//  app.get(paths.user.logIn, auth.login);
//
//  it('redirects to auth0', function(done) {
//    request(app)
//      .get(paths.user.logIn)
//      .expect(302)
//      .expect('Location', /my.test.auth0/)
//      .end(done);
//  });
//  it('redirects to auth0 if authenticated', function(done) {
//    request(app)
//      .get(paths.user.logIn)
//      .set('Cookie', valid_session)
//      .expect(302)
//      .expect('Location', /my.test.auth0/)
//      .end(done);
//  });
//  it('includes the callback url in the request', function(done) {
//    request(app)
//      .get('/login')
//      .expect(302)
//      .expect('Location', /redirect_uri=.*callback/)
//      .end(done);
//  });
//});
//
//describe('An endpoint that handles callbacks', function(done) {
//  var app = express();
//  auth.bind(app);
//  app.get('/return-to-me', auth.callback);
//
//  var session_with_last_url = ['session=' + auth_cookie.create({
//    last_url: '/my-protected-page',
//  })];
//
//  it('unsets the last_url', function(done) {
//    request(app)
//      .get('/return-to-me')
//      .set('Cookie', session_with_last_url)
//      .expect(function(req) {
//        should.exist(req.headers['set-cookie']);
//
//        var session = auth_cookie.decrypt(req);
//        should.not.exist(session.last_url);
//      })
//      .end(done);
//  });
//
//  it('redirects to the last_url', function(done) {
//    var Strategy = require('passport').Strategy, util = require('util');
//    function MockStrategy() {
//      this.name = 'auth0';
//    }
//    util.inherits(MockStrategy, Strategy);
//    MockStrategy.prototype.authenticate = function (req) {
//      this.success({
//        user: { name: 'Michael' }
//      });
//    };
//    auth.bind(app, new MockStrategy());
//    request(app)
//      .get('/return-to-me')
//      .set('Cookie', session_with_last_url)
//      .expect(302)
//      .expect('Location', '/my-protected-page')
//      .end(done);
//  });
//});
