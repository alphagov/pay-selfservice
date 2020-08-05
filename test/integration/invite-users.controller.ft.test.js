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
const sinon = require('sinon')
const _ = require('lodash')
const inviteUserController = require('../../app/controllers/invite-user.controller')

const expect = chai.expect
const adminusersMock = nock(process.env.ADMINUSERS_URL)

const formattedPathFor = require('../../app/utils/replace-params-in-path')

describe('invite user controller', function () {
  const userInSession = session.getUser({})
  const EXTERNAL_SERVICE_ID = userInSession.serviceRoles[0].service.externalId
  userInSession.serviceRoles[0].role.permissions.push({ name: 'users-service:create' })
  const INVITE_RESOURCE = `/v1/api/invites/user`

  describe('invite user index view', function () {
    it('should display invite page', function (done) {
      const app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .get(formattedPathFor(paths.teamMembers.invite, EXTERNAL_SERVICE_ID))
        .set('Accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body.teamMemberIndexLink).to.equal(formattedPathFor(paths.teamMembers.index, EXTERNAL_SERVICE_ID))
          expect(res.body.teamMemberInviteSubmitLink).to.equal(formattedPathFor(paths.teamMembers.invite, EXTERNAL_SERVICE_ID))
          expect(res.body.admin.id).to.equal(roles['admin'].extId)
          expect(res.body.viewAndRefund.id).to.equal(roles['view-and-refund'].extId)
          expect(res.body.view.id).to.equal(roles['view-only'].extId)
        })
        .end(done)
    })
  })

  describe('invite user', function () {
    it('should invite a new team member successfully', function (done) {
      let validInvite = inviteFixtures.validInviteRequest()
      adminusersMock.post(INVITE_RESOURCE)
        .reply(201, inviteFixtures.validInviteResponse(validInvite.getPlain()))
      const app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .post(formattedPathFor(paths.teamMembers.invite, EXTERNAL_SERVICE_ID))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'invitee-email': 'invitee@example.com',
          'role-input': roles['admin'].extId,
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', formattedPathFor(paths.teamMembers.index, EXTERNAL_SERVICE_ID))
        .end(done)
    })

    it('should error if the user is already invited/exists', function (done) {
      let existingUser = 'existing-user@example.com'
      adminusersMock.post(INVITE_RESOURCE)
        .reply(412, inviteFixtures.conflictingInviteResponseWhenEmailUserAlreadyCreated(existingUser).getPlain())
      const app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .post(formattedPathFor(paths.teamMembers.invite, EXTERNAL_SERVICE_ID))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'invitee-email': existingUser,
          'role-input': roles['admin'].extId,
          csrfToken: csrf().create('123')
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.error.message).to.include(existingUser)
        })
        .end(done)
    })

    it('should error on unknown role externalId', function (done) {
      let unknownRoleId = '999'

      const app = session.getAppWithLoggedInUser(getApp(), userInSession)

      supertest(app)
        .post(formattedPathFor(paths.teamMembers.invite, EXTERNAL_SERVICE_ID))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'invitee-email': 'invitee@example.com',
          'role-input': unknownRoleId,
          csrfToken: csrf().create('123')
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to send invitation at this time')
        })
        .end(done)
    })

    it('should error invitee is an invalid email address', function (done) {
      let baseReq = {
        flash: sinon.stub()
      }
      let res = {
        redirect: sinon.stub()
      }

      let invalidEmail = 'invalid@examplecom'
      const externalServiceId = 'some-external-service-id'
      let req = _.merge(baseReq, {
        correlationId: 'blah',
        user: { externalId: 'some-ext-id', serviceIds: ['1'] },
        body: { 'invitee-email': invalidEmail, 'role-input': '200' },
        service: {
          externalId: externalServiceId
        }
      })

      inviteUserController.invite(req, res)

      expect(req.flash.calledWith('genericError', 'Invalid email address')).to.equal(true)
      expect(res.redirect.calledWith(303, formattedPathFor(paths.teamMembers.invite, externalServiceId))).to.equal(true)
      done()
    })
  })
})
