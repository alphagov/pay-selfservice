require(__dirname + '/../test_helpers/serialize_mock.js');
var request     = require('supertest');
var nock = require('nock');
var _app         = require(__dirname + '/../../server.js').getApp;
var should      = require('chai').should();
var paths       = require(__dirname + '/../../app/paths.js');
var mock_session     = require(__dirname + '/../test_helpers/mock_session.js');
var assert = require('assert');
var adminusersMock = nock(process.env.ADMINUSERS_URL);
const USER_RESOURCE = '/v1/api/users';

var user = mock_session.getUser();
var session = mock_session.getMockSession(user);

var app = mock_session.getAppWithSession(_app, session);

function build_get_request(path) {
  return request(app)
    .get(path);
}

describe('User clicks on Logout', function() {
  it('should get redirected to login page', function(done) {

    let incrementMock = adminusersMock
      .patch(`${USER_RESOURCE}/${user.username}`)
      .reply(200);

    build_get_request(paths.user.logOut)
      .expect(302, {})
      .expect('Location', paths.user.logIn)
      .expect(() => {
        assert(incrementMock.isDone());
        assert(session.destroy.called == true);
      })
      .end(done);
  });
});
