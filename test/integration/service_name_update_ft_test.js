require(__dirname + '/../test_helpers/serialize_mock.js');
let supertest = require('supertest');
let getApp = require(__dirname + '/../../server.js').getApp;
let nock = require('nock');
let paths = require(__dirname + '/../../app/paths.js');
let session = require(__dirname + '/../test_helpers/mock_session.js');
let csrf = require('csrf');
let userFixtures = require(__dirname + '/../fixtures/user_fixtures');
let chai = require('chai');
let _ = require('lodash');
let chaiAsPromised = require('chai-as-promised');

let SERVICE_ID = 1;

chai.use(chaiAsPromised);

let adminusersMock = nock(process.env.ADMINUSERS_URL);

describe('service name update', function () {
  const SERVICE_RESOURCE = '/v1/api/services';

  const EXTERNAL_ID_LOGGED_IN = '7d19aff33f8948deb97ed16b2912dcd3';
  const USERNAME_LOGGED_IN = 'existing-user';

  afterEach((done) => {
    nock.cleanAll();
    app = null;
    done();
  });

  it.only('update service name', function (done) {

    let user = session.getUser({
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN + '@example.com',
      service_ids: [SERVICE_ID]
    });

    let serviceData = {
      service_ids: ['1'],
      currentServiceName: 'System Generated'
    };

    let mockGatewayAccountCookie = {
      currentGatewayAccountId: 1
    };

    let getUserResponse = userFixtures.validUserResponse(user);

    adminusersMock.get(`${SERVICE_RESOURCE}`)
      .reply(200, getUserResponse.getPlain());

    adminusersMock.put(`${SERVICE_RESOURCE}/${SERVICE_ID}`, {'service_name': 'New Service Name'})
      .reply(200, getUserResponse.getPlain());

    let mockSession = session.getMockSession(user);

    let app = session.getAppWithSessionAndService(getApp(), mockSession, mockGatewayAccountCookie, serviceData);



    return supertest(app)
      .post(paths.updateServiceName.edit)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        csrfToken: csrf().create('123')
      })
      .expect(200, {})
      .end(done);
  });
});


