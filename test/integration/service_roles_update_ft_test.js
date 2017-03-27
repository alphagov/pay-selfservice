let nock = require('nock');
let session = require(__dirname + '/../test_helpers/mock_session.js');
let getApp = require(__dirname + '/../../server.js').getApp;
let supertest = require('supertest');
let csrf = require('csrf');
let userFixtures = require(__dirname + '/../fixtures/user_fixtures');
let paths = require(__dirname + '/../../app/paths.js');
let roles = require('../../app/utils/roles').roles;
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let app;

chai.use(chaiAsPromised);
let expect = chai.expect;
let adminusersMock = nock(process.env.ADMINUSERS_URL);

const USER_RESOURCE = '/v1/api/users';

let updatePermissionPath = username => {
  return paths.teamMembers.permissions.replace(':username', username);
};

describe('user permissions update controller', function () {

  let serviceId = '1';
  let usernameToView = 'other-user';

  let userInSession = session.getUser({
    username: 'existing-user',
    email: 'existing-user@example.com',
    service_ids: [serviceId],
    permissions: ['users-service:create']
  });

  let userToView = {
    username: usernameToView,
    email: `${usernameToView}@example.com`,
    service_ids: [serviceId],
    role: roles['view-only']
  };

  afterEach((done) => {
    nock.cleanAll();
    app = null;
    done();
  });

  describe('user permissions update view', function () {

    it('should render the permission update view', function (done) {

      let getUserResponse = userFixtures.validUserResponse(userToView);

      adminusersMock.get(`${USER_RESOURCE}/${usernameToView}`)
        .reply(200, getUserResponse.getPlain());

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      return supertest(app)
        .get(updatePermissionPath(usernameToView))
        .set('Accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body.email).to.equal(userToView.email);
          expect(res.body.editPermissionsLink).to.equal(paths.teamMembers.permissions.replace(':username', usernameToView));
          expect(res.body.admin.id).to.equal(roles['admin'].id);
          expect(res.body.admin.checked).to.equal('');
          expect(res.body.viewAndRefund.id).to.equal(roles['view-and-refund'].id);
          expect(res.body.viewAndRefund.checked).to.equal('');
          expect(res.body.view.id).to.equal(roles['view-only'].id);
          expect(res.body.view.checked).to.equal('checked');
        })
        .end(done);
    });

    it('should error if user not found', function (done) {

      adminusersMock.get(`${USER_RESOURCE}/${usernameToView}`)
        .reply(404);

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      return supertest(app)
        .get(updatePermissionPath(usernameToView))
        .set('Accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to locate the user');
        })
        .end(done);
    });

    it('should error if user trying to update his own permissions', function (done) {

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      return supertest(app)
        .get(updatePermissionPath(userInSession.username))
        .set('Accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body.message).to.equal('Not allowed to update self permission');
        })
        .end(done);
    });

  });

  describe('user permissions update', function () {

    it('should update users permission successfully', function (done) {

      let getUserResponse = userFixtures.validUserResponse(userToView);

      adminusersMock.get(`${USER_RESOURCE}/${usernameToView}`)
        .reply(200, getUserResponse.getPlain());

      adminusersMock.put(`${USER_RESOURCE}/${usernameToView}/services/${serviceId}`, {'role_name': 'admin'})
        .reply(200, getUserResponse.getPlain());

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      return supertest(app)
        .post(updatePermissionPath(usernameToView))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': '2',
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', `${paths.teamMembers}/${usernameToView}`)
        .end(done);
    });

    it('should update users permission successfully, even if selected role is the same as existing', function (done) {

      let getUserResponse = userFixtures.validUserResponse(userToView);

      adminusersMock.get(`${USER_RESOURCE}/${usernameToView}`)
        .reply(200, getUserResponse.getPlain());

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      return supertest(app)
        .post(updatePermissionPath(usernameToView))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': '4', //same as existing
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', `${paths.teamMembers}/${usernameToView}`)
        .end(done);
    });

    it('should error if user trying to update his own permissions', function (done) {

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      return supertest(app)
        .post(updatePermissionPath(userInSession.username))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': '2',
          csrfToken: csrf().create('123')
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).to.equal('Not allowed to update self permission');
        })
        .end(done);
    });

    it('should error if user not found', function (done) {

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      adminusersMock.get(`${USER_RESOURCE}/${usernameToView}`)
        .reply(404);

      return supertest(app)
        .post(updatePermissionPath(usernameToView))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': '2',
          csrfToken: csrf().create('123')
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to locate the user');
        })
        .end(done);
    });

    it('should error if role id cannot be resolved', function (done) {

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      let nonExistentRoleId = '999';
      return supertest(app)
        .post(updatePermissionPath(usernameToView))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': nonExistentRoleId,
          csrfToken: csrf().create('123')
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to update user permission');
        })
        .end(done);
    });

    it('should error on permission update error in adminusers', function (done) {

      let getUserResponse = userFixtures.validUserResponse(userToView);
      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      adminusersMock.get(`${USER_RESOURCE}/${usernameToView}`)
        .reply(200, getUserResponse.getPlain());

      adminusersMock.put(`${USER_RESOURCE}/${usernameToView}/services/${serviceId}`, {'role_name': 'admin'})
        .reply(409);

      return supertest(app)
        .post(updatePermissionPath(usernameToView))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': '2',
          csrfToken: csrf().create('123')
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to update user permission');
        })
        .end(done);
    });

  });

});
