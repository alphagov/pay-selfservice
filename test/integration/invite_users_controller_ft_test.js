let nock = require('nock');
let getApp = require(__dirname + '/../../server.js').getApp;
let supertest = require('supertest');
let session = require(__dirname + '/../test_helpers/mock_session.js');
let csrf = require('csrf');
let chai = require('chai');
let roles = require('../../app/utils/roles').roles;
let paths = require(__dirname + '/../../app/paths.js');
let inviteFixtures = require(__dirname + '/../fixtures/invite_fixtures');
let sinon = require('sinon');
let _ = require('lodash');
let inviteUserController = require('../../app/controllers/invite_user_controller');


let expect = chai.expect;
let adminusersMock = nock(process.env.ADMINUSERS_URL);

describe('invite user controller', function () {

  const SERVICE_ID = '1';
  const EXTERNAL_ID_IN_SESSION = '7d19aff33f8948deb97ed16b2912dcd3';
  const USERNAME_IN_SESSION = 'existing-user';
  const INVITE_RESOURCE = `/v1/api/services/${SERVICE_ID}/invites`;

  let userInSession = session.getUser({
    external_id: EXTERNAL_ID_IN_SESSION,
    username: USERNAME_IN_SESSION,
    email: USERNAME_IN_SESSION + '@example.com',
    service_ids: [SERVICE_ID],
    permissions: ['users-service:create']
  });

  describe('invite user index view', function () {

    it('should display invite page', function (done) {

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      return supertest(app)
        .get(paths.teamMembers.invite)
        .set('Accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body.admin.id).to.equal(roles['admin'].extId);
          expect(res.body.viewAndRefund.id).to.equal(roles['view-and-refund'].extId);
          expect(res.body.view.id).to.equal(roles['view-only'].extId);
        })
        .end(done)
    });

  });


  describe('invite user', function () {

    it('should invite a new team member successfully', function (done) {

      let validInvite = inviteFixtures.validInviteRequest();
      adminusersMock.post(INVITE_RESOURCE)
        .reply(201, inviteFixtures.validInviteResponse(validInvite.getPlain()));
      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      return supertest(app)
        .post(paths.teamMembers.invite)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'invitee-email': 'invitee@example.com',
          'role-input': roles['admin'].extId,
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.teamMembers.index)
        .end(done);
    });

    it('should error if the user is already invited/exists', function (done) {

      let existingUser = 'existing-user@example.com';
      adminusersMock.post(INVITE_RESOURCE)
        .reply(409, inviteFixtures.conflictingInviteResponseWhenEmailUserAlreadyCreated(existingUser).getPlain());
      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      return supertest(app)
        .post(paths.teamMembers.invite)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'invitee-email': existingUser,
          'role-input': roles['admin'].extId,
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.teamMembers.invite)
        .end(done);
    });

    it('should error on unknown role externalId', function (done) {

      let unknownRoleId = '999';

      app = session.getAppWithLoggedInUser(getApp(), userInSession);

      return supertest(app)
        .post(paths.teamMembers.invite)
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
          expect(res.body.message).to.equal('Unable to send invitation at this time');
        })
        .end(done);
    });

    it('should error invitee is an invalid email address', function (done) {

      let baseReq = {
        flash: sinon.stub()
      };
      let res = {
        redirect: sinon.stub()
      };

      let invalidEmail = 'invalid@examplecom';
      let req = _.merge(baseReq, {
        correlationId: 'blah',
        user: {externalId: 'some-ext-id', serviceIds: ['1']},
        body: {'invitee-email': invalidEmail, 'role-input': '200'}
      });

      inviteUserController.invite(req, res);

      expect(req.flash.calledWith('genericError', 'Invalid email address')).to.equal(true);
      expect(res.redirect.calledWith(303, paths.teamMembers.invite)).to.equal(true);
      done();
    });
  });

});
