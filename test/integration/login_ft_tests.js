require(__dirname + '/../test_helpers/serialize_mock.js');
const request = require('supertest');
const nock = require('nock');
const getApp = require(__dirname + '/../../server.js').getApp;
const should = require('chai').should();
const paths = require(__dirname + '/../../app/paths.js');
const mock_session = require(__dirname + '/../test_helpers/mock_session.js');
const assert = require('assert');
const {expect} = require('chai');
const adminusersMock = nock(process.env.ADMINUSERS_URL);
const USER_RESOURCE = '/v1/api/users';

const user = mock_session.getUser();
const session = mock_session.getMockSession(user);

const app = mock_session.getAppWithSessionAndGatewayAccountCookies(getApp(), session);

function build_get_request(path) {
  return request(app)
    .get(path);
}

describe('User clicks on Logout', function () {

  it('should get redirected to login page', function (done) {

    const incrementMock = adminusersMock
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

  it('should redirect to login page when session.version is undefined', function (done) {

    const gatewayAccountId = 12314;
    const mockSession = mock_session.getMockSession({sessionVersion:2, services:['1'], gateway_account_ids: [gatewayAccountId]});
    delete mockSession.version;

    let app = mock_session.createAppWithSession(getApp(), mockSession);

    request(app)
      .get('/')
      .expect(302)
      .expect('Location', '/login')
      .expect(() => {
        expect(mockSession.version).to.be.undefined;
      })
      .end(done);
  });

  it('should update the session version on successful login of a user', done => {

    const gatewayAccountId = 12314;
    const mockSession = mock_session.getMockSession({sessionVersion:2, services:['1'], gateway_account_ids: [gatewayAccountId]});
    delete mockSession.version;

    let app = mock_session.createAppWithSession(getApp(), mockSession);

    request(app)
      .get('/')
      .expect(302)
      .expect('Location', '/login')
      .expect(() => {
        expect(mockSession.version).to.be.undefined;
      })
      .end(done);

  })
});
