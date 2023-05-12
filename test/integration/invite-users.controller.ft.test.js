const path = require('path')
const nock = require('nock')
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const supertest = require('supertest')
const session = require(path.join(__dirname, '/../test-helpers/mock-session.js'))
const csrf = require('csrf')
const chai = require('chai')
const roles = require('../../app/utils/roles').roles
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const inviteFixtures = require(path.join(__dirname, '/../fixtures/invite.fixtures'))

const expect = chai.expect
const adminusersMock = nock(process.env.ADMINUSERS_URL)

const formatServicePathsFor = require('../../app/utils/format-service-paths-for')

describe('invite user controller', function () {
  const userInSession = session.getUser({})
  const EXTERNAL_SERVICE_ID = userInSession.serviceRoles[0].service.externalId
  userInSession.serviceRoles[0].role.permissions.push({ name: 'users-service:create' })
  const INVITE_RESOURCE = '/v1/api/invites/create-invite-to-join-service'

  describe('invite user index view', function () {
    it('should display invite page', function (done) {
      const app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .get(formatServicePathsFor(paths.service.teamMembers.invite, EXTERNAL_SERVICE_ID))
        .set('Accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body.teamMemberIndexLink).to.equal(formatServicePathsFor(paths.service.teamMembers.index, EXTERNAL_SERVICE_ID))
          expect(res.body.teamMemberInviteSubmitLink).to.equal(formatServicePathsFor(paths.service.teamMembers.invite, EXTERNAL_SERVICE_ID))
          expect(res.body.admin.id).to.equal(roles.admin.extId)
          expect(res.body.viewAndRefund.id).to.equal(roles['view-and-refund'].extId)
          expect(res.body.view.id).to.equal(roles['view-only'].extId)
          expect(res.body.viewAndInitiateMoto.id).to.equal(roles['view-and-initiate-moto'].extId)
          expect(res.body.viewRefundAndInitiateMoto.id).to.equal(roles['view-refund-and-initiate-moto'].extId)
        })
        .end(done)
    })
  })

  describe('invite user', function () {
    it('should invite a new team member successfully', function (done) {
      const validInvite = inviteFixtures.validCreateInviteToJoinServiceRequest()
      adminusersMock.post(INVITE_RESOURCE)
        .reply(201, inviteFixtures.validInviteResponse(validInvite))
      const app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .post(formatServicePathsFor(paths.service.teamMembers.invite, EXTERNAL_SERVICE_ID))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'invitee-email': 'invitee@example.com',
          'role-input': roles.admin.extId,
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', formatServicePathsFor(paths.service.teamMembers.index, EXTERNAL_SERVICE_ID))
        .end(done)
    })

    it('should error if the user is already invited/exists', function (done) {
      const existingUser = 'existing-user@example.com'
      adminusersMock.post(INVITE_RESOURCE)
        .reply(412, inviteFixtures.conflictingInviteResponseWhenEmailUserAlreadyCreated(existingUser))
      const app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .post(formatServicePathsFor(paths.service.teamMembers.invite, EXTERNAL_SERVICE_ID))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'invitee-email': existingUser,
          'role-input': roles.admin.extId,
          csrfToken: csrf().create('123')
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.error.message).to.include(existingUser)
        })
        .end(done)
    })

    it('should error on unknown role externalId', function (done) {
      const unknownRoleId = '999'

      const app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .post(formatServicePathsFor(paths.service.teamMembers.invite, EXTERNAL_SERVICE_ID))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'invitee-email': 'invitee@example.com',
          'role-input': unknownRoleId,
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
