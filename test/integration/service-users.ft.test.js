'use strict'

// NPM modules
const nock = require('nock')
const supertest = require('supertest')
const csrf = require('csrf')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const { expect } = chai

// Local modules
const session = require('../test-helpers/mock-session.js')
const { getApp } = require('../../server.js')
const inviteFixtures = require('../fixtures/invite.fixtures')
const userFixtures = require('../fixtures/user.fixtures')
const paths = require('../../app/paths.js')
const formatServicePathsFor = require('../../app/utils/format-service-paths-for')
const User = require('../../app/models/User.class')

// Local constants
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const SERVICE_RESOURCE = '/v1/api/services'
const INVITE_RESOURCE = '/v1/api/invites'
const USER_RESOURCE = '/v1/api/users'

let app
chai.use(chaiAsPromised)

describe('service users resource', () => {
  let EXTERNAL_ID_LOGGED_IN = '7d19aff33f8948deb97ed16b2912dcd3'
  const USERNAME_LOGGED_IN = 'existing-user@example.com'
  const EXTERNAL_ID_OTHER_USER = '393266e872594f1593558549caad95ec'
  const USERNAME_OTHER_USER = 'other-user@example.com'

  afterEach(done => {
    nock.cleanAll()
    app = null
    done()
  })

  it('get list of service users should link to my profile for my user', done => {
    const externalServiceId = '734rgw76jhka'
    let userOpts = {
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN,
      service_roles: [{
        service: {
          name: 'System Generated',
          external_id: externalServiceId
        },
        role: {
          name: 'admin',
          description: 'Administrator',
          permissions: [{
            name: 'users-service:create'
          }]
        }
      }]
    }
    const serviceUsersRes = userFixtures.validUsersResponse([userOpts])
    const getInvitesRes = inviteFixtures.validListInvitesResponse()
    const user = new User(userFixtures.validUserResponse(userOpts))

    adminusersMock.get(`${SERVICE_RESOURCE}/${externalServiceId}/users`)
      .reply(200, serviceUsersRes)
    adminusersMock.get(`${INVITE_RESOURCE}?serviceId=${externalServiceId}`)
      .reply(200, getInvitesRes)
    app = session.getAppWithLoggedInUser(getApp(), user)

    supertest(app)
      .get(formatServicePathsFor(paths.service.teamMembers.index, externalServiceId))
      .set('Accept', 'application/json')
      .expect(200)
      .expect(res => {
        expect(res.body.team_members.admin.length).to.equal(1)
        expect(res.body.team_members.admin[0].username).to.equal(USERNAME_LOGGED_IN)
        expect(res.body.team_members.admin[0].link).to.equal('/my-profile')
        expect(res.body.team_members.admin[0].is_current).to.equal(true)
        expect(res.body.team_members['view-only'].length).to.equal(0)
        expect(res.body.team_members['view-and-refund'].length).to.equal(0)
        expect(res.body.team_members['view-and-initiate-moto'].length).to.equal(0)
        expect(res.body.team_members['view-refund-and-initiate-moto'].length).to.equal(0)
      })
      .end(done)
  })

  it('get list of service users should link to a users view details for other users', done => {
    const externalServiceId = '734rgw76jhka'

    const serviceRoles = [{
      service: {
        name: 'System Generated',
        external_id: externalServiceId
      },
      role: { name: 'admin', description: 'Administrator', permissions: [{ name: 'users-service:create' }] }
    }]
    const user = session.getUser({
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN + '@example.com',
      service_roles: serviceRoles
    })

    const serviceUsersRes = userFixtures.validUsersResponse([{
      service_roles: serviceRoles
    }, {
      external_id: EXTERNAL_ID_OTHER_USER,
      service_roles: serviceRoles
    }])
    const getInvitesRes = inviteFixtures.validListInvitesResponse()

    adminusersMock.get(`${SERVICE_RESOURCE}/${externalServiceId}/users`)
      .reply(200, serviceUsersRes)
    adminusersMock.get(`${INVITE_RESOURCE}?serviceId=${externalServiceId}`)
      .reply(200, getInvitesRes)
    app = session.getAppWithLoggedInUser(getApp(), user)

    supertest(app)
      .get(formatServicePathsFor(paths.service.teamMembers.index, externalServiceId))
      .set('Accept', 'application/json')
      .expect(200)
      .expect(res => {
        expect(res.body.team_members.admin[1].link).to.equal(formatServicePathsFor(paths.service.teamMembers.show, externalServiceId, EXTERNAL_ID_OTHER_USER))
      })
      .end(done)
  })

  it('should error when accessing a service that the user is not a member of', done => {
    const externalServiceId = '734rgw76jhka'
    const noAccessServiceId = 'no_access'

    const serviceRoles = [{
      service: {
        name: 'System Generated',
        external_id: externalServiceId
      },
      role: { name: 'admin', description: 'Administrator', permissions: [{ name: 'users-service:create' }] }
    }]

    const user = session.getUser({
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN + '@example.com',
      service_roles: serviceRoles
    })

    const serviceUsersRes = userFixtures.validUsersResponse([{
      service_roles: []
    }, {
      external_id: EXTERNAL_ID_OTHER_USER,
      service_roles: []
    }])
    const getInvitesRes = inviteFixtures.validListInvitesResponse()

    adminusersMock.get(`${SERVICE_RESOURCE}/${noAccessServiceId}/users`)
      .reply(200, serviceUsersRes)
    adminusersMock.get(`${INVITE_RESOURCE}?serviceId=${noAccessServiceId}`)
      .reply(200, getInvitesRes)

    app = session.getAppWithLoggedInUser(getApp(), user)

    supertest(app)
      .get(formatServicePathsFor(paths.service.teamMembers.index, noAccessServiceId))
      .set('Accept', 'application/json')
      .expect(403)
      .end(done)
  })

  it('view team member details', done => {
    const externalServiceId = '734rgw76jhka'
    const userInSession = session.getUser({
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN,
      service_roles: [{
        service: {
          name: 'System Generated',
          external_id: externalServiceId
        },
        role: { name: 'admin', description: 'Administrator', permissions: [{ name: 'users-service:read' }] }
      }]
    })

    const userToView = {
      external_id: EXTERNAL_ID_OTHER_USER,
      username: USERNAME_OTHER_USER,
      email: USERNAME_OTHER_USER,
      service_roles: [{
        service: {
          name: 'System Generated',
          external_id: externalServiceId
        },
        role: { name: 'view-only', description: 'View only' }
      }]
    }
    const getUserResponse = userFixtures.validUserResponse(userToView)

    adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_OTHER_USER}`)
      .reply(200, getUserResponse)

    app = session.getAppWithLoggedInUser(getApp(), userInSession)

    supertest(app)
      .get(formatServicePathsFor(paths.service.teamMembers.show, externalServiceId, EXTERNAL_ID_OTHER_USER))
      .set('Accept', 'application/json')
      .expect(200)
      .expect(res => {
        expect(res.body.username).to.equal(USERNAME_OTHER_USER)
        expect(res.body.email).to.equal('other-user@example.com')
        expect(res.body.role).to.equal('View only')
        expect(res.body.editPermissionsLink).to.equal(formatServicePathsFor(paths.service.teamMembers.permissions, externalServiceId, EXTERNAL_ID_OTHER_USER))
        expect(res.body.removeTeamMemberLink).to.equal(formatServicePathsFor(paths.service.teamMembers.delete, externalServiceId, EXTERNAL_ID_OTHER_USER))
      })
      .end(done)
  })

  it('should show my profile', done => {
    const user = {
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN,
      telephone_number: '+447876548778',
      // TODO: fix to use serviceRoles
      services: [{
        name: 'System Generated',
        external_id: '8348754ihuwk'
      }]
    }
    const userInSession = session.getUser(user)
    const getUserResponse = userFixtures.validUserResponse(user)

    adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_LOGGED_IN}`)
      .reply(200, getUserResponse)

    app = session.getAppWithLoggedInUser(getApp(), userInSession)

    supertest(app)
      .get('/my-profile')
      .set('Accept', 'application/json')
      .expect(200)
      .expect(res => {
        expect(res.body.username).to.equal(user.username)
        expect(res.body.email).to.equal(user.email)
        expect(res.body.telephone_number).to.equal(user.telephone_number)
      })
      .end(done)
  })

  it('should not show my profile without second factor', done => {
    const user = {
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN + '@example.com',
      telephone_number: '+447876548778',
      // TODO: fix to use serviceRoles
      services: [{
        name: 'System Generated',
        external_id: '3894hewfui'
      }]
    }
    const userInSession = session.getUser(user)
    const getUserResponse = userFixtures.validUserResponse(user)

    adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_LOGGED_IN}`)
      .reply(200, getUserResponse)

    app = session.getAppWithSessionWithoutSecondFactor(getApp(), userInSession)

    supertest(app)
      .get('/my-profile')
      .set('Accept', 'application/json')
      .expect(302)
      .expect('Location', '/login')
      .end(done)
  })

  it('should redirect to my profile when trying to access my user through team members path', done => {
    const userInSession = session.getUser({
      permissions: [{ name: 'users-service:read' }]
    })
    const externalServiceId = userInSession.serviceRoles[0].service.externalId
    EXTERNAL_ID_LOGGED_IN = userInSession.externalId

    app = session.getAppWithLoggedInUser(getApp(), userInSession)

    supertest(app)
      .get(formatServicePathsFor(paths.service.teamMembers.show, externalServiceId, EXTERNAL_ID_LOGGED_IN))
      .set('Accept', 'application/json')
      .expect(302)
      .expect('Location', '/my-profile')
      .end(done)
  })

  it('error when accessing an user from other service profile (cheeky!)', done => {
    const externalServiceId1 = '48753g874tg'
    const externalServiceId2 = '7huh4y7tu6g'
    const user = session.getUser({
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN + '@example.com',
      service_roles: [{
        service: {
          name: 'System Generated',
          external_id: externalServiceId1
        },
        role: { name: 'admin', description: 'Administrator', permissions: [{ name: 'users-service:read' }] }
      }]
    })
    const getUserResponse = userFixtures.validUserResponse({
      external_id: EXTERNAL_ID_OTHER_USER,
      username: USERNAME_OTHER_USER,
      service_roles: [{
        service: {
          name: 'System Generated',
          external_id: externalServiceId2
        },
        role: {
          name: 'view-only',
          description: 'View only',
          permissions: [{ name: 'users-service:read' }]
        }
      }]
    })

    adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_OTHER_USER}`)
      .reply(200, getUserResponse)

    app = session.getAppWithLoggedInUser(getApp(), user)

    supertest(app)
      .get(formatServicePathsFor(paths.service.teamMembers.show, externalServiceId2, EXTERNAL_ID_OTHER_USER))
      .set('Accept', 'application/json')
      .expect(403)
      .expect(res => {
        expect(res.body.message).to.equal('You do not have the rights to access this service.')
      })
      .end(done)
  })

  it('remove a team member successfully should redirect user to team member', done => {
    const userInSession = session.getUser({
      permissions: [{ name: 'users-service:delete' }]
    })
    const externalServiceId = userInSession.serviceRoles[0].service.externalId
    EXTERNAL_ID_LOGGED_IN = userInSession.externalId

    const userToDelete = {
      external_id: EXTERNAL_ID_OTHER_USER,
      username: USERNAME_OTHER_USER,
      role: { name: 'view-only' }
    }

    const getUserResponse = userFixtures.validUserResponse(userToDelete)

    adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_OTHER_USER}`)
      .reply(200, getUserResponse)

    adminusersMock.delete(`${SERVICE_RESOURCE}/${externalServiceId}/users/${EXTERNAL_ID_OTHER_USER}`)
      .reply(200)

    app = session.getAppWithLoggedInUser(getApp(), userInSession)

    supertest(app)
      .post(formatServicePathsFor(paths.service.teamMembers.delete, externalServiceId, EXTERNAL_ID_OTHER_USER))
      .send({ csrfToken: csrf().create('123') })
      .expect(302)
      .expect('Location', formatServicePathsFor(paths.service.teamMembers.index, externalServiceId))
      .end(done)
  })

  it('when remove a team member fails when user does not exist should redirect user to error view with link to view team members', done => {
    const userInSession = session.getUser({
      permissions: [{ name: 'users-service:delete' }]
    })

    const externalServiceId = userInSession.serviceRoles[0].service.externalId
    EXTERNAL_ID_LOGGED_IN = userInSession.externalId

    adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_OTHER_USER}`)
      .reply(404)

    app = session.getAppWithLoggedInUser(getApp(), userInSession)

    supertest(app)
      .post(formatServicePathsFor(paths.service.teamMembers.delete, externalServiceId, EXTERNAL_ID_OTHER_USER))
      .set('Accept', 'application/json')
      .send({ csrfToken: csrf().create('123') })
      .expect(200)
      .expect(res => {
        expect(res.body.error.title).to.equal('This person has already been removed')
        expect(res.body.error.message).to.equal('This person has already been removed by another administrator.')
        expect(res.body.link.link).to.equal(`/service/${externalServiceId}/team-members`)
        expect(res.body.link.text).to.equal('View all team members')
        expect(res.body.enable_link).to.equal(true)
      })
      .end(done)
  })

  it('get list of invited users', done => {
    const externalServiceId = '734rgw76jhka'
    const serviceRoles = [{
      service: {
        name: 'System Generated',
        external_id: externalServiceId
      },
      role: { name: 'admin', description: 'Administrator', permissions: [{ name: 'users-service:create' }] }
    }]
    const user = session.getUser({
      external_id: EXTERNAL_ID_LOGGED_IN,
      username: USERNAME_LOGGED_IN,
      email: USERNAME_LOGGED_IN,
      service_roles: serviceRoles
    })
    const FIRST_EMAIL = 'esdfkjh@email.test'
    const SECOND_EMAIL = 'esdfkjh2@email.test'
    const invites = [{
      email: FIRST_EMAIL,
      telephone_number: '',
      disabled: false,
      role: 'admin',
      expired: false,
      user_exist: false
    }, {
      email: SECOND_EMAIL,
      telephone_number: '',
      disabled: false,
      role: 'view-only',
      expired: false,
      user_exist: false
    }]
    const serviceUsersRes = userFixtures.validUsersResponse([{ service_roles: serviceRoles }])
    const getInvitesRes = inviteFixtures.validListInvitesResponse(invites)

    adminusersMock.get(`${SERVICE_RESOURCE}/${externalServiceId}/users`)
      .reply(200, serviceUsersRes)
    adminusersMock.get(`${INVITE_RESOURCE}?serviceId=${externalServiceId}`)
      .reply(200, getInvitesRes)
    app = session.getAppWithLoggedInUser(getApp(), user)

    supertest(app)
      .get(formatServicePathsFor(paths.service.teamMembers.index, externalServiceId))
      .set('Accept', 'application/json')
      .expect(200)
      .expect(res => {
        expect(res.body.number_invited_members).to.equal(2)
        expect(res.body.invited_team_members.admin.length).to.equal(1)
        expect(res.body.invited_team_members.admin[0].username).to.equal(FIRST_EMAIL)
        expect(res.body.invited_team_members['view-only'].length).to.equal(1)
        expect(res.body.invited_team_members['view-only'][0].username).to.equal(SECOND_EMAIL)
        expect(res.body.invited_team_members['view-and-refund'].length).to.equal(0)
        expect(res.body.invited_team_members['view-and-initiate-moto'].length).to.equal(0)
        expect(res.body.invited_team_members['view-refund-and-initiate-moto'].length).to.equal(0)
      })
      .end(done)
  })
})
