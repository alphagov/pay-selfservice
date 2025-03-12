const sinon = require('sinon')
const { expect } = require('chai')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

const adminUser = new User(userFixtures.validUserResponse({
  external_id: 'user-id-for-admin-user',
  service_roles: {
    service: {
      service: { external_id: SERVICE_ID },
      role: { name: 'admin' }
    }
  }
}))
const viewOnlyUser = new User(userFixtures.validUserResponse(
  {
    external_id: 'user-id-for-view-only-user',
    service_roles: {
      service:
        {
          service: { external_id: SERVICE_ID },
          role: { name: 'view-only' }
        }
    }
  }))
const users = [adminUser, viewOnlyUser]
const invitedUsers = [
  { email: 'invited-admin-user@user.gov.uk', role: 'admin' },
  { email: 'invited-view-only-user@user.gov.uk', role: 'view-only' }
]

const mockResponse = sinon.spy()
const mockGetServiceUsers = sinon.stub().resolves(users)
const mockGetInvitedUsers = sinon.stub().resolves(invitedUsers)

const { res, nextRequest, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/team-members/team-members.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/user.service':
      { getServiceUsers: mockGetServiceUsers, getInvitedUsers: mockGetInvitedUsers }

  })
  .build()

describe('Controller: settings/team-members', () => {
  describe('get', () => {
    before(() => {
      nextRequest({
        user: adminUser
      })
      call('get')
    })

    it('should call the response method', () => {
      expect(mockGetServiceUsers.called).to.be.true // eslint-disable-line
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0].user).to.deep.include(adminUser)
      expect(mockResponse.args[0]).to.include(res)
      expect(mockResponse.args[0]).to.include('simplified-account/settings/team-members/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('teamMembers').to.have.property('admin').to.have.length(1)
      expect(mockResponse.args[0][3].teamMembers.admin[0]).to.have.property('externalId').to.equal('user-id-for-admin-user')
      expect(mockResponse.args[0][3].teamMembers).to.have.property('view-only').to.have.length(1)
      expect(mockResponse.args[0][3].teamMembers['view-only'][0]).to.have.property('externalId').to.equal('user-id-for-view-only-user')

      expect(mockResponse.args[0][3]).to.have.property('invitedTeamMembers').to.have.property('admin').to.have.length(1)
      expect(mockResponse.args[0][3].invitedTeamMembers.admin[0]).to.have.property('email').to.equal('invited-admin-user@user.gov.uk')
      expect(mockResponse.args[0][3].invitedTeamMembers).to.have.property('view-only').to.have.length(1)
      expect(mockResponse.args[0][3].invitedTeamMembers['view-only'][0]).to.have.property('email').to.equal('invited-view-only-user@user.gov.uk')

      expect(mockResponse.args[0][3]).to.have.property('inviteTeamMemberLink')
        .to.equal('/service/service-id-123abc/account/test/settings/team-members/invite')
      expect(mockResponse.args[0][3]).to.have.property('numberInvitedMembers').to.equal(2)
      expect(mockResponse.args[0][3]).to.have.property('isServiceAdmin').to.be.true // eslint-disable-line no-unused-expressions
      expect(mockResponse.args[0][3]).to.have.property('roles').to.have.keys('admin', 'view-and-initiate-moto', 'view-and-refund', 'view-only', 'view-refund-and-initiate-moto')
    })
  })

  describe('get', () => {
    before(() => {
      nextRequest({
        user: adminUser
      })
      call('get')
    })

    it('should call the response method', () => {
      expect(mockGetServiceUsers.called).to.be.true // eslint-disable-line
      expect(mockResponse.called).to.be.true // eslint-disable-line
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0].user).to.deep.include(adminUser)
      expect(mockResponse.args[0]).to.include(res)
      expect(mockResponse.args[0]).to.include('simplified-account/settings/team-members/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('teamMembers').to.have.property('admin').to.have.length(1)
      expect(mockResponse.args[0][3].teamMembers.admin[0]).to.have.property('externalId').to.equal('user-id-for-admin-user')
      expect(mockResponse.args[0][3].teamMembers).to.have.property('view-only').to.have.length(1)
      expect(mockResponse.args[0][3].teamMembers['view-only'][0]).to.have.property('externalId').to.equal('user-id-for-view-only-user')

      expect(mockResponse.args[0][3]).to.have.property('invitedTeamMembers').to.have.property('admin').to.have.length(1)
      expect(mockResponse.args[0][3].invitedTeamMembers.admin[0]).to.have.property('email').to.equal('invited-admin-user@user.gov.uk')
      expect(mockResponse.args[0][3].invitedTeamMembers).to.have.property('view-only').to.have.length(1)
      expect(mockResponse.args[0][3].invitedTeamMembers['view-only'][0]).to.have.property('email').to.equal('invited-view-only-user@user.gov.uk')

      expect(mockResponse.args[0][3]).to.have.property('inviteTeamMemberLink')
        .to.equal('/service/service-id-123abc/account/test/settings/team-members/invite')
      expect(mockResponse.args[0][3]).to.have.property('numberInvitedMembers').to.equal(2)
      expect(mockResponse.args[0][3]).to.have.property('isServiceAdmin').to.be.true // eslint-disable-line no-unused-expressions
      expect(mockResponse.args[0][3]).to.have.property('roles').to.have.keys('admin', 'view-and-initiate-moto', 'view-and-refund', 'view-only', 'view-refund-and-initiate-moto')
    })
  })
})
