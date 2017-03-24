let nock = require('nock');
let session = require(__dirname + '/../test_helpers/mock_session.js');
let getApp = require(__dirname + '/../../server.js').getApp;
let supertest = require('supertest');
let serviceFixtures = require(__dirname + '/../fixtures/service_fixtures');
let userFixtures = require(__dirname + '/../fixtures/user_fixtures');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let app;

chai.use(chaiAsPromised);
let expect = chai.expect;
let adminusersMock = nock(process.env.ADMINUSERS_URL);

const SERVICE_RESOURCE = '/v1/api/services';
const USER_RESOURCE = '/v1/api/users';

describe('service users resource', function () {

  afterEach((done) => {
    nock.cleanAll();
    app = null;
    done();
  });

  it('get list of service users should link to my profile for my user', function (done) {

    let service_id = '1';
    let user = session.getUser({
      service_ids: [service_id],
      username: 'existing-user',
      email: 'existing-user@example.com'
    });

    let serviceUsersRes = serviceFixtures.validServiceUsersResponse([{}]);

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
        expect(res.body.team_members.admin[0].link).to.equal('/my-profile');
        expect(res.body.team_members.admin[0].is_current).to.equal(true);
        expect(res.body.team_members['view-only'].length).to.equal(0);
        expect(res.body.team_members['view-and-refund'].length).to.equal(0);
      })
      .end(done);
  });

  it('get list of service users should link to a users view details for other users', function (done) {

    let service_id = '1';
    let user = session.getUser({
      service_ids: [service_id],
      username: 'existing-user',
      email: 'existing-user@example.com',
      permissions: ['users-service:read']
    });

    let serviceUsersRes = serviceFixtures.validServiceUsersResponse([{}, {username: 'other-user'}]);

    adminusersMock.get(`${SERVICE_RESOURCE}/${service_id}/users`)
      .reply(200, serviceUsersRes.getPlain());

    app = session.getAppWithLoggedInUser(getApp(), user);

    return supertest(app)
      .get('/team-members')
      .set('Accept', 'application/json')
      .expect(200)
      .expect((res) => {
        expect(res.body.team_members.admin[1].link).to.equal('/team-members/other-user');
      })
      .end(done);
  });

  it('view team member details', function (done) {

    let service_id = '1';
    let username_to_view = 'other-user';

    let user_in_session = session.getUser({
      username: 'existing-user',
      email: 'existing-user@example.com',
      service_ids: [service_id],
      permissions: ['users-service:read']
    });

    let user_to_view = {
      username: username_to_view,
      service_ids: [service_id],
      role: {"name": "view-only"}
    };

    let getUserResponse = userFixtures.validUserResponse(user_to_view);

    adminusersMock.get(`${USER_RESOURCE}/${username_to_view}`)
      .reply(200, getUserResponse.getPlain());

    app = session.getAppWithLoggedInUser(getApp(), user_in_session);

    return supertest(app)
      .get(`/team-members/${username_to_view}`)
      .set('Accept', 'application/json')
      .expect(200)
      .expect((res) => {
        expect(res.body.username).to.equal('other-user');
        expect(res.body.email).to.equal('other-user@example.com');
        expect(res.body.role).to.equal('View only');
      })
      .end(done);
  });


  it('should show my profile', function (done) {

    let user = {
      username: 'existing-user',
      service_ids: ['1'],
      email: 'existing-user@example.com',
      telephone_number: '+447876548778'
    };

    let user_in_session = session.getUser(user);

    let getUserResponse = userFixtures.validUserResponse(user);

    adminusersMock.get(`${USER_RESOURCE}/existing-user`)
      .reply(200, getUserResponse.getPlain());

    app = session.getAppWithLoggedInUser(getApp(), user_in_session);

    return supertest(app)
      .get('/my-profile')
      .set('Accept', 'application/json')
      .expect(200)
      .expect((res) => {
        expect(res.body.username).to.equal('existing-user');
        expect(res.body.email).to.equal('existing-user@example.com');
        expect(res.body['telephone_number']).to.equal('+447876548778');
      })
      .end(done);
  });

  it('should redirect to my profile when trying to access my user through team members path', function (done) {

    let user_in_session = session.getUser({
      service_ids: ['1'],
      username: 'existing-user',
      email: 'existing-user@example.com',
      permissions: ['users-service:read']
    });

    app = session.getAppWithLoggedInUser(getApp(), user_in_session);

    return supertest(app)
      .get('/team-members/existing-user')
      .set('Accept', 'application/json')
      .expect(302)
      .expect('Location', "/my-profile")
      .end(done);
  });

  it('error when accessing an user from other service profile (cheeky!)', function (done) {

    let service_id = '1';
    let username_to_view = 'other-user';

    let user = session.getUser({
      service_ids: [service_id],
      username: 'existing-user',
      email: 'existing-user@example.com',
      permissions: ['users-service:read']
    });

    let getUserResponse = userFixtures.validUserResponse({username: username_to_view, service_ids: ['2']});

    adminusersMock.get(`${USER_RESOURCE}/${username_to_view}`)
      .reply(200, getUserResponse.getPlain());

    app = session.getAppWithLoggedInUser(getApp(), user);

    return supertest(app)
      .get('/team-members/other-user')
      .set('Accept', 'application/json')
      .expect(200)
      .expect((res) => {
        expect(res.body.message).to.equal('Error displaying this user of the current service');
      })
      .end(done);
  });
});
