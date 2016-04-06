// THESE ARE HERE TO SET GLOBAL ENV VARIABLES
process.env.AUTH0_URL = 'my.test.auth0';
process.env.AUTH0_CLIENT_ID = 'client12345';
process.env.AUTH0_CLIENT_SECRET = 'clientsupersecret';
process.env.DISABLE_INTERNAL_HTTPS = "true"; // to support other unit tests
process.env.SECURE_COOKIE_OFF = "true";
process.env.COOKIE_MAX_AGE = "10800000";
process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk';
process.env.SESSION_IN_MEMORY = "true";

var request     = require('supertest');
var auth        = require(__dirname + '/../app/services/auth_service.js');
var express     = require('express');
var mockSession = require(__dirname + '/test_helpers/mock_session.js').mockSession;
var paths       = require(__dirname + '/../app/paths.js');

var valid_session = {
  passport: {
    user: {
      name: 'Michael',
      _json: {
        app_metadata: {
          account_id: 123
        }
      }
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
  auth.bind(app);
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

describe('An endpoint protected by auth.enforce', function () {
  var app = express();
  auth.bind(app);
  var withNoSession = mockSession(app);

  app.get('/protected', auth.enforce, function (req, res) {
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

describe('An endpoint that enforces login', function (done) {

  var app = express();
  auth.bind(app);
  var withNoSession = mockSession(app);

  app.get(paths.user.logIn, auth.login);

  it('redirects to auth0', function (done) {
    request(withNoSession)
      .get(paths.user.logIn)
      .expect(302)
      .expect('Location', /my.test.auth0/)
      .end(done);
  });

  it('redirects to auth0 if authenticated', function (done) {
    request(mockSession(app, valid_session))
      .get(paths.user.logIn)
      .expect(302)
      .expect('Location', /my.test.auth0/)
      .end(done);
  });

  it('includes the callback url in the request', function (done) {
    request(withNoSession)
      .get('/login')
      .expect(302)
      .expect('Location', /redirect_uri=.*callback/)
      .end(done);
  });

});

describe('An endpoint that handles callbacks', function (done) {
  var app = express();
  auth.bind(app);

  app.get('/return-to-me', auth.callback);

  var session_with_last_url = {
    last_url: '/my-protected-page'
  };

  it('redirects to the last_url', function (done) {
    var Strategy = require('passport').Strategy, util = require('util');

    function MockStrategy() {
      this.name = 'auth0';
    }

    util.inherits(MockStrategy, Strategy);
    MockStrategy.prototype.authenticate = function (req) {
      this.success({
        user: {name: 'Michael'}
      });
    };

    auth.bind(app, new MockStrategy());

    request(mockSession(app, session_with_last_url))
      .get('/return-to-me')
      .expect(302)
      .expect('Location', '/my-protected-page')
      .end(done);
  });
});
