const path = require('path')
const nock = require('nock')
const session = require(path.join(__dirname, '/../test-helpers/mock-session.js'))
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const supertest = require('supertest')
const csrf = require('csrf')
const userFixtures = require(path.join(__dirname, '/../fixtures/user.fixtures'))
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const roles = require('../../app/utils/roles').roles
const chai = require('chai')
const _ = require('lodash')
const chaiAsPromised = require('chai-as-promised')
let app

chai.use(chaiAsPromised)

const expect = chai.expect
const adminusersMock = nock(process.env.ADMINUSERS_URL)

const USER_RESOURCE = '/v1/api/users'

const formatServicePathsFor = require('../../app/utils/format-service-paths-for')

describe('user permissions update controller', function () {
  const EXTERNAL_SERVICE_ID = '38745gf8y'
  const EXTERNAL_ID_IN_SESSION = '7d19aff33f8948deb97ed16b2912dcd3'
  const USERNAME_IN_SESSION = 'existing-user'
  const EXTERNAL_ID_TO_VIEW = '393266e872594f1593558549caad95ec'
  const USERNAME_TO_VIEW = 'other-user'

  const userInSession = session.getUser({
    external_id: EXTERNAL_ID_IN_SESSION,
    username: USERNAME_IN_SESSION,
    email: USERNAME_IN_SESSION + '@example.com',
    service_roles: [{
      service: {
        name: 'System Generated',
        external_id: EXTERNAL_SERVICE_ID
      },
      role: { name: 'admin', description: 'Administrator', permissions: [{ name: 'users-service:create' }] }
    }]
  })

  const userToView = {
    external_id: EXTERNAL_ID_TO_VIEW,
    username: USERNAME_TO_VIEW,
    email: `${USERNAME_TO_VIEW}@example.com`,
    service_roles: [{
      service: {
        name: 'System Generated',
        external_id: EXTERNAL_SERVICE_ID
      },
      role: { name: 'view-only', description: 'View only', permissions: [] }
    }]
  }

  afterEach((done) => {
    nock.cleanAll()
    app = null
    done()
  })

  describe('user permissions update view', function () {
    it('should render the permission update view', function (done) {
      const getUserResponse = userFixtures.validUserResponse(userToView)

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(200, getUserResponse)

      app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .get(formatServicePathsFor(paths.service.teamMembers.permissions, EXTERNAL_SERVICE_ID, EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body.email).to.equal(userToView.email)
          expect(res.body.editPermissionsLink).to.equal(formatServicePathsFor(paths.service.teamMembers.permissions, EXTERNAL_SERVICE_ID, EXTERNAL_ID_TO_VIEW))
          expect(res.body.admin.id).to.equal(roles.admin.extId)
          expect(res.body.admin.checked).to.equal('')
          expect(res.body.viewAndRefund.id).to.equal(roles['view-and-refund'].extId)
          expect(res.body.viewAndRefund.checked).to.equal('')
          expect(res.body.view.id).to.equal(roles['view-only'].extId)
          expect(res.body.view.checked).to.equal('checked')
        })
        .end(done)
    })

    it('should error if user not found', function (done) {
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(404)

      app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .get(formatServicePathsFor(paths.service.teamMembers.permissions, EXTERNAL_SERVICE_ID, EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .expect(500)
        .end(done)
    })

    it('should error if admin does not belong to users service', function (done) {
      const targetUser = _.cloneDeep(userToView)
      targetUser.service_roles[0].service.external_id = 'other-service-id'

      const getUserResponse = userFixtures.validUserResponse(targetUser)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(200, getUserResponse)

      app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .get(formatServicePathsFor(paths.service.teamMembers.permissions, EXTERNAL_SERVICE_ID, EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .expect(500)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to update permissions for this user')
        })
        .end(done)
    })

    it('should error if user trying to update his own permissions', function (done) {
      app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .get(formatServicePathsFor(paths.service.teamMembers.permissions, EXTERNAL_SERVICE_ID, userInSession.externalId))
        .set('Accept', 'application/json')
        .expect(403)
        .expect((res) => {
          expect(res.body.message).to.equal('Not allowed to update self permission')
        })
        .end(done)
    })
  })

  describe('user permissions update', function () {
    it('should update users permission successfully', function (done) {
      const getUserResponse = userFixtures.validUserResponse(userToView)

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(200, getUserResponse)

      adminusersMock.put(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}/services/${EXTERNAL_SERVICE_ID}`, { role_name: 'admin' })
        .reply(200, getUserResponse)

      app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .post(formatServicePathsFor(paths.service.teamMembers.permissions, EXTERNAL_SERVICE_ID, EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': roles.admin.extId,
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', formatServicePathsFor(paths.service.teamMembers.show, EXTERNAL_SERVICE_ID, EXTERNAL_ID_TO_VIEW))
        .end(done)
    })

    it('should update users permission successfully, even if selected role is the same as existing', function (done) {
      const getUserResponse = userFixtures.validUserResponse(userToView)

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(200, getUserResponse)

      adminusersMock.put(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}/services/${EXTERNAL_SERVICE_ID}`, { role_name: 'view-only' })
        .reply(200, getUserResponse)

      app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .post(formatServicePathsFor(paths.service.teamMembers.permissions, EXTERNAL_SERVICE_ID, EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': roles['view-only'].extId, // same as existing
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', formatServicePathsFor(paths.service.teamMembers.show, EXTERNAL_SERVICE_ID, EXTERNAL_ID_TO_VIEW))
        .end(done)
    })

    it('should error if user trying to update his own permissions', function (done) {
      app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .post(formatServicePathsFor(paths.service.teamMembers.permissions, EXTERNAL_SERVICE_ID, userInSession.externalId))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': roles.admin.extId,
          csrfToken: csrf().create('123')
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).to.equal('Not allowed to update self permission')
        })
        .end(done)
    })

    it('should error if user not found', function (done) {
      app = session.getAppWithLoggedInUser(getApp(), userInSession)

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(404)

      supertest(app)
        .post(formatServicePathsFor(paths.service.teamMembers.permissions, EXTERNAL_SERVICE_ID, EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': roles.admin.extId,
          csrfToken: csrf().create('123')
        })
        .expect(500)
        .end(done)
    })

    it('should error if admin does not belong to users service', function (done) {
      const targetUser = _.cloneDeep(userToView)
      targetUser.service_roles[0].service.external_id = 'other-service-id'

      const getUserResponse = userFixtures.validUserResponse(targetUser)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(200, getUserResponse)

      app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .post(formatServicePathsFor(paths.service.teamMembers.permissions, EXTERNAL_SERVICE_ID, EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': roles.admin.extId,
          csrfToken: csrf().create('123')
        })
        .expect(500)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to update permissions for this user')
        })
        .end(done)
    })

    it('should error if role id cannot be resolved', function (done) {
      app = session.getAppWithLoggedInUser(getApp(), userInSession)

      const nonExistentRoleId = '999'
      supertest(app)
        .post(formatServicePathsFor(paths.service.teamMembers.permissions, EXTERNAL_SERVICE_ID, EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': nonExistentRoleId,
          csrfToken: csrf().create('123')
        })
        .expect(500)
        .end(done)
    })

    it('should error on permission update error in adminusers', function (done) {
      const getUserResponse = userFixtures.validUserResponse(userToView)
      app = session.getAppWithLoggedInUser(getApp(), userInSession)

      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}`)
        .reply(200, getUserResponse)

      adminusersMock.put(`${USER_RESOURCE}/${EXTERNAL_ID_TO_VIEW}/services/${EXTERNAL_SERVICE_ID}`, { role_name: 'admin' })
        .reply(409)

      supertest(app)
        .post(formatServicePathsFor(paths.service.teamMembers.permissions, EXTERNAL_SERVICE_ID, EXTERNAL_ID_TO_VIEW))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'role-input': roles.admin.extId,
          csrfToken: csrf().create('123')
        })
        .expect(500)
        .expect((res) => {
          expect(res.body.message).to.equal('There is a problem with the payments platform. Please contact the support team.')
        })
        .end(done)
    })
  })
})
