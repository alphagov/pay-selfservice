let nock = require('nock');
let session = require(__dirname + '/../test_helpers/mock_session.js');
let getApp = require(__dirname + '/../../server.js').getApp;
let supertest = require('supertest');
let csrf = require('csrf');
let userFixtures = require(__dirname + '/../fixtures/user_fixtures');
let paths = require(__dirname + '/../../app/paths.js');
let roles = require('../../app/utils/roles').roles;
let chai = require('chai');
let _ = require('lodash');
let chaiAsPromised = require('chai-as-promised');
let app;

chai.use(chaiAsPromised);

let expect = chai.expect;
let adminusersMock = nock(process.env.ADMINUSERS_URL);

const USER_RESOURCE = '/v1/api/users';

let updatePermissionPath = externalId => {
  return paths.teamMembers.permissions.replace(':externalId', externalId);
};

describe('user permissions update controller', function () {

  const SERVICE_ID = '1';
  const EXTERNAL_ID_IN_SESSION = '7d19aff33f8948deb97ed16b2912dcd3';
  const USERNAME_IN_SESSION = 'existing-user';
  const EXTERNAL_ID_TO_VIEW = '393266e872594f1593558549caad95ec';
  const USERNAME_TO_VIEW = 'other-user';

  let userInSession = session.getUser({
    external_id: EXTERNAL_ID_IN_SESSION,
    username: USERNAME_IN_SESSION,
    email: USERNAME_IN_SESSION + '@example.com',
    service_ids: [SERVICE_ID],
    permissions: ['users-service:create']
  });

  let userToView = {
    external_id: EXTERNAL_ID_TO_VIEW,
    username: USERNAME_TO_VIEW,
    email: `${USERNAME_TO_VIEW}@example.com`,
    service_ids: [SERVICE_ID],
    role: {name: 'view-only', description: 'View only'}
  };

  afterEach((done) => {
    nock.cleanAll();
    app = null;
    done();
  });

  describe('user permissions update view', function () {

    it('should render the permission update view', function (done) {

      let getUserResponse = userFixtures.validUserResponse(userToView);

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(200, getUserResponse.getPlain());

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      supertest(app)
        .get(updatePermissionPath(EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body.email).to.equal(userToView.email);
          expect(res.body.editPermissionsLink).to.equal(paths.teamMembers.permissions.replace(':externalId', EXTERNAL_ID_TO_VIEW));
          expect(res.body.admin.id).to.equal(roles['admin'].extId);
          expect(res.body.admin.checked).to.equal('');
          expect(res.body.viewAndRefund.id).to.equal(roles['view-and-refund'].extId);
          expect(res.body.viewAndRefund.checked).to.equal('');
          expect(res.body.view.id).to.equal(roles['view-only'].extId);
          expect(res.body.view.checked).to.equal('checked');
        })
        .end(done);
    });

    it('should error if user not found', function (done) {

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(404);

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      supertest(app)
        .get(updatePermissionPath(EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .expect(500)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to locate the user');
        })
        .end(done);
    });

    it('should error if admin does not belong to users service', function (done) {

      let targetUser = _.cloneDeep(userToView);
      targetUser.service_ids[0] = '2';

      let getUserResponse = userFixtures.validUserResponse(targetUser);
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(200, getUserResponse.getPlain());

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      supertest(app)
        .get(updatePermissionPath(EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .expect(500)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to update permissions for this user');
        })
        .end(done);
    });

    it('should error if user trying to update his own permissions', function (done) {

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      supertest(app)
        .get(updatePermissionPath(userInSession.externalId))
        .set('Accept', 'application/json')
        .expect(500)
        .expect((res) => {
          expect(res.body.message).to.equal('Not allowed to update self permission');
        })
        .end(done);
    });

  });

  describe('user permissions update', function () {

    it('should update users permission successfully', function (done) {

      let getUserResponse = userFixtures.validUserResponse(userToView);

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(200, getUserResponse.getPlain());

      adminusersMock.put(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}/services/${SERVICE_ID}`, {'role_name': 'admin'})
        .reply(200, getUserResponse.getPlain());

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      supertest(app)
        .post(updatePermissionPath(EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': roles['admin'].extId,
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.teamMembers.show.replace(':externalId', EXTERNAL_ID_TO_VIEW))
        .end(done);
    });

    it('should update users permission successfully, even if selected role is the same as existing', function (done) {

      let getUserResponse = userFixtures.validUserResponse(userToView);

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(200, getUserResponse.getPlain());

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      supertest(app)
        .post(updatePermissionPath(EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': roles['view-only'].extId, //same as existing
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.teamMembers.show.replace(':externalId', EXTERNAL_ID_TO_VIEW))
        .end(done);
    });

    it('should error if user trying to update his own permissions', function (done) {

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      supertest(app)
        .post(updatePermissionPath(userInSession.externalId))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': roles['admin'].extId,
          csrfToken: csrf().create('123')
        })
        .expect(500)
        .expect((res) => {
          expect(res.body.message).to.equal('Not allowed to update self permission');
        })
        .end(done);
    });

    it('should error if user not found', function (done) {

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(404);

      supertest(app)
        .post(updatePermissionPath(EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': roles['admin'].extId,
          csrfToken: csrf().create('123')
        })
        .expect(500)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to locate the user');
        })
        .end(done);
    });

    it('should error if admin does not belong to users service', function (done) {

      let targetUser = _.cloneDeep(userToView);
      targetUser.service_ids[0] = '2';

      let getUserResponse = userFixtures.validUserResponse(targetUser);
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(200, getUserResponse.getPlain());

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      supertest(app)
        .post(updatePermissionPath(EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': roles['admin'].extId,
          csrfToken: csrf().create('123')
        })
        .expect(500)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to update permissions for this user');
        })
        .end(done);
    });

    it('should error if role id cannot be resolved', function (done) {

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      let nonExistentRoleId = '999';
      supertest(app)
        .post(updatePermissionPath(EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': nonExistentRoleId,
          csrfToken: csrf().create('123')
        })
        .expect(500)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to update user permission');
        })
        .end(done);
    });

    it('should error on permission update error in adminusers', function (done) {

      let getUserResponse = userFixtures.validUserResponse(userToView);
      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(200, getUserResponse.getPlain());

      adminusersMock.put(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}/services/${SERVICE_ID}`, {'role_name': 'admin'})
        .reply(409);

      supertest(app)
        .post(updatePermissionPath(EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': roles['admin'].extId,
          csrfToken: csrf().create('123')
        })
        .expect(500)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to update user permission');
        })
        .end(done);
    });

  });

});
