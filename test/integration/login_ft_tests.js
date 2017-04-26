require(__dirname + '/../test_helpers/serialize_mock.js');
let request     = require('supertest');
let nock = require('nock');
let getApp         = require(__dirname + '/../../server.js').getApp;
let should      = require('chai').should();
let paths       = require(__dirname + '/../../app/paths.js');
let mock_session     = require(__dirname + '/../test_helpers/mock_session.js');
let assert = require('assert');
let adminusersMock = nock(process.env.ADMINUSERS_URL);
const USER_RESOURCE = '/v1/api/users';

let user = mock_session.getUser();
let session = mock_session.getMockSession(user);

let app = mock_session.getAppWithSessionAndGatewayAccountCookies(getApp(), session);

function build_get_request(path) {
  return request(app)
    .get(path);
}

describe('User clicks on Logout', function() {
  it('should get redirected to login page', function(done) {

    let incrementMock = adminusersMock
      .patch(`${USER_RESOURCE}/${user.externalId}`)
      .reply(200);

    build_get_request(paths.user.logOut)
      .expect(302, {})
      .expect('Location', paths.user.logIn)
      .expect(() => {
        assert(incrementMock.isDone());
        assert(session.destroy.called === true);
      })
      .end(done);
  });
});
