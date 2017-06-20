let nock = require('nock');
let session = require(__dirname + '/../test_helpers/mock_session.js');
let getApp = require(__dirname + '/../../server.js').getApp;
let supertest = require('supertest');
let serviceFixtures = require(__dirname + '/../fixtures/service_fixtures');
let userFixtures = require(__dirname + '/../fixtures/user_fixtures');
let paths = require(__dirname + '/../../app/paths.js');
let roles = require('../../app/utils/roles').roles;
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let csrf = require('csrf');
let app;

chai.use(chaiAsPromised);

let expect = chai.expect;
let adminusersMock = nock(process.env.ADMINUSERS_URL);

const SERVICE_RESOURCE = '/v1/api/services';
const USER_RESOURCE = '/v1/api/users';

describe('service users resource', function () {

  const EXTERNAL_ID_LOGGED_IN = '7d19aff33f8948deb97ed16b2912dcd3';
  const USERNAME_LOGGED_IN = 'existing-user';
  const EXTERNAL_ID_OTHER_USER = '393266e872594f1593558549caad95ec';
  const USERNAME_OTHER_USER = 'other-user';

  afterEach((done) => {
    nock.cleanAll();
    app = null;
    done();
  });

  it('get list of service users should link to my profile for my user', function (done) {

    let service_id = '1';
    let user = session.getUser({
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN + '@example.com',
      service_ids: [service_id]
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
        expect(res.body.team_members.admin[0].username).to.equal(USERNAME_LOGGED_IN);
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
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN + '@example.com',
      service_ids: [service_id],
      permissions: ['users-service:read']
    });

    let serviceUsersRes = serviceFixtures.validServiceUsersResponse([{}, {external_id: EXTERNAL_ID_OTHER_USER}]);

    adminusersMock.get(`${SERVICE_RESOURCE}/${service_id}/users`)
      .reply(200, serviceUsersRes.getPlain());

    app = session.getAppWithLoggedInUser(getApp(), user);

    return supertest(app)
      .get('/team-members')
      .set('Accept', 'application/json')
      .expect(200)
      .expect((res) => {
        expect(res.body.team_members.admin[1].link).to.equal(`/team-members/${EXTERNAL_ID_OTHER_USER}`);
      })
      .end(done);
  });

  it('view team member details', function (done) {

    let service_id = '1';

    let user_in_session = session.getUser({
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN + '@example.com',
      service_ids: [service_id],
      permissions: ['users-service:read']
    });

    let user_to_view = {
      external_id: EXTERNAL_ID_OTHER_USER,
      username: USERNAME_OTHER_USER,
      service_ids: [service_id],
      role: {"name": "view-only"}
    };

    let getUserResponse = userFixtures.validUserResponse(user_to_view);

    adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_OTHER_USER}`)
      .reply(200, getUserResponse.getPlain());

    app = session.getAppWithLoggedInUser(getApp(), user_in_session);

    return supertest(app)
      .get(`/team-members/${EXTERNAL_ID_OTHER_USER}`)
      .set('Accept', 'application/json')
      .expect(200)
      .expect((res) => {
        expect(res.body.username).to.equal(USERNAME_OTHER_USER);
        expect(res.body.email).to.equal('other-user@example.com');
        expect(res.body.role).to.equal('View only');
        expect(res.body.editPermissionsLink).to.equal(paths.teamMembers.permissions.replace(':externalId', EXTERNAL_ID_OTHER_USER));
        expect(res.body.removeTeamMemberLink).to.equal(paths.teamMembers.delete.replace(':externalId', EXTERNAL_ID_OTHER_USER));
      })
      .end(done);
  });

  it('should show my profile', function (done) {

    let user = {
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN + '@example.com',
      telephone_number: '+447876548778',
      service_ids: ['1']
    };

    let user_in_session = session.getUser(user);

    let getUserResponse = userFixtures.validUserResponse(user);

    adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_LOGGED_IN}`)
      .reply(200, getUserResponse.getPlain());

    app = session.getAppWithLoggedInUser(getApp(), user_in_session);

    return supertest(app)
      .get('/my-profile')
      .set('Accept', 'application/json')
      .expect(200)
      .expect((res) => {
        expect(res.body.username).to.equal(user.username);
        expect(res.body.email).to.equal(user.email);
        expect(res.body['telephone_number']).to.equal(user.telephone_number);
      })
      .end(done);
  });

  it('should redirect to my profile when trying to access my user through team members path', function (done) {

    let user_in_session = session.getUser({
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN + '@example.com',
      service_ids: ['1'],
      permissions: ['users-service:read']
    });

    app = session.getAppWithLoggedInUser(getApp(), user_in_session);

    return supertest(app)
      .get(`/team-members/${EXTERNAL_ID_LOGGED_IN}`)
      .set('Accept', 'application/json')
      .expect(302)
      .expect('Location', "/my-profile")
      .end(done);
  });

  it('error when accessing an user from other service profile (cheeky!)', function (done) {

    let service_id = '1';

    let user = session.getUser({
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN + '@example.com',
      service_ids: [service_id],
      permissions: ['users-service:read']
    });

    let getUserResponse = userFixtures.validUserResponse({
      external_id: EXTERNAL_ID_OTHER_USER,
      username: USERNAME_OTHER_USER,
      service_ids: ['2']
    });

    adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_OTHER_USER}`)
      .reply(200, getUserResponse.getPlain());

    app = session.getAppWithLoggedInUser(getApp(), user);

    return supertest(app)
      .get(`/team-members/${EXTERNAL_ID_OTHER_USER}`)
      .set('Accept', 'application/json')
      .expect(500)
      .expect((res) => {
        expect(res.body.message).to.equal('Error displaying this user of the current service');
      })
      .end(done);
  });

  it('remove a team member', function (done) {

    let service_id = '1';

    let user_in_session = session.getUser({
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN + '@example.com',
      service_ids: [service_id],
      permissions: ['users-service:delete'],
    });

    let user_to_delete = {
      external_id: EXTERNAL_ID_OTHER_USER,
      username: USERNAME_OTHER_USER,
      service_ids: [service_id],
      role: {"name": "view-only"}
    };

    let getUserResponse = userFixtures.validUserResponse(user_to_delete);

    adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_OTHER_USER}`)
      .reply(200, getUserResponse.getPlain());

    adminusersMock.delete(`${SERVICE_RESOURCE}/users/${EXTERNAL_ID_OTHER_USER}`)
      .reply(200);


    app = session.getAppWithLoggedInUser(getApp(), user_in_session);

    return supertest(app)
      .post(`/team-members/${EXTERNAL_ID_OTHER_USER}/delete`)
      .send({csrfToken: csrf().create('123')})
      .expect(303)
      .expect('Location', "/team-members")
      .expect((res) => {
        console.log(JSON.stringify(res));
      })
      .end(done);
  });
});
