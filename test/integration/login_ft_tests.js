var dbMock      = require(__dirname + '/../test_helpers/db_mock.js');
var request     = require('supertest');
var app         = require(__dirname + '/../../server.js').getApp;
var should      = require('chai').should();
var paths       = require(__dirname + '/../../app/paths.js');
var session     = require(__dirname + '/../test_helpers/mock_session.js');

var app = session.getAppWithLoggedInSession(app, '12345');

function build_get_request(path) {
  return request(app)
    .get(path);
}

describe('User clicks on Logout', function() {
  it('should get redirected to login page', function(done) {
    build_get_request(paths.user.logOut)
      .expect(302, {})
      .expect('Location', paths.user.logIn)
      .end(done);
  });
});
