let nock = require('nock');
let session = require(__dirname + '/../test_helpers/mock_session.js');
let getApp = require(__dirname + '/../../server.js').getApp;
let supertest = require('supertest');
let serviceFixtures = require(__dirname + '/../fixtures/service_fixtures');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let app;

chai.use(chaiAsPromised);
let expect = chai.expect;
let adminusersMock = nock(process.env.ADMINUSERS_URL);

const SERVICE_RESOURCE = '/v1/api/services';

describe('service users resource', function () {

  afterEach((done) => {
    nock.cleanAll();
    app = null;
    done();
  });

  it('get list of service users ', function (done) {

    let service_id = '1';
    let user = session.getUser({
      service_ids: [service_id],
      email: 'existing-user@example.com'
    });

    let serviceUsersRes = serviceFixtures.validServiceUsersResponse({});

    adminusersMock.get(`${SERVICE_RESOURCE}/${service_id}/users`)
      .reply(200, serviceUsersRes.getPlain());

    app = session.getAppWithLoggedInUser(getApp(), user);

    return supertest(app)
      .get('/team-members')
      .set('Accept', 'application/json')
      .expect(200)
      .expect((res) => {
        expect(res.body.number_active_members).to.equal(1);
        expect(res.body.number_admin_members).to.equal(1);
        expect(res.body['number_view-only_members']).to.equal(0);
        expect(res.body['number_view-and-refund_members']).to.equal(0);
        expect(res.body.team_members.admin.length).to.equal(1);
        expect(res.body.team_members.admin[0].username).to.equal('existing-user');
        expect(res.body.team_members.admin[0].is_current).to.equal(true);
        expect(res.body.team_members['view-only'].length).to.equal(0);
        expect(res.body.team_members['view-and-refund'].length).to.equal(0);
      })
      .end(done);
  });

});
