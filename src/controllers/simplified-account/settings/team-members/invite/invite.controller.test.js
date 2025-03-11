const sinon = require('sinon')
const { expect } = require('chai')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')
const paths = require('@root/paths')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

const adminUser = new User(userFixtures.validUserResponse({
  external_id: 'user-id-for-admin-user',
  email: 'admin-user@users.gov.uk',
  service_roles: {
    service: {
      service: { external_id: SERVICE_ID },
      role: { name: 'admin' }
    }
  }
}))

const mockResponse = sinon.spy()
const mockCreateInviteToJoinServiceSuccess = sinon.stub().resolves()
const mockCreateInviteToJoinServiceRejects = sinon.stub().rejects(new RESTClientError(null, 'adminusers', 412))

const { req, res, nextRequest, nextStubs, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/team-members/invite/invite.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse }
  })
  .withUser(adminUser)
  .build()

describe('Controller: settings/team-members/invite', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/team-members/invite')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('availableRoles').to.have.length(3)
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal('/simplified/service/service-id-123abc/account/test/settings/team-members')
    })
  })
})

describe('post', () => {
  describe('success', () => {
    before(() => {
      nextRequest({
        body: { invitedUserEmail: 'user-to-invite@users.gov.uk', invitedUserRole: 'view-only' }
      })
      nextStubs({
        '@services/user.service':
          { createInviteToJoinService: mockCreateInviteToJoinServiceSuccess }
      })
      call('post')
    })

    it('should call adminusers to send an invite', () => {
      expect(mockCreateInviteToJoinServiceSuccess.calledWith('user-to-invite@users.gov.uk', adminUser.externalId, SERVICE_ID, 'view-only')).to.be.true // eslint-disable-line
    })

    it('should redirect to the team members index page', () => {
      expect(req.flash).to.have.been.calledWith('messages', {
        state: 'success',
        icon: '&check;',
        heading: 'Team member invitation sent to user-to-invite@users.gov.uk'
      })
      expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
      expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.teamMembers.index)
    })
  })

  describe('failure - user already in service', () => {
    before(() => {
      nextRequest({
        body: { invitedUserEmail: 'user-to-invite@users.gov.uk', invitedUserRole: 'view-only' }
      })
      nextStubs({
        '@services/user.service':
          { createInviteToJoinService: mockCreateInviteToJoinServiceRejects }
      })
      call('post')
    })

    it('should respond with error message', () => {
      expect(mockCreateInviteToJoinServiceRejects.calledWith('user-to-invite@users.gov.uk', adminUser.externalId, SERVICE_ID, 'view-only')).to.be.true // eslint-disable-line
      expect(mockResponse.calledOnce).to.be.true // eslint-disable-line
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/team-members/invite')
      expect(mockResponse.args[0][3]).to.have.property('errors').to.deep.equal({
        summary: [{ text: 'This person has already been invited', href: '#invited-user-email' }],
        formErrors: { invitedUserEmail: 'You cannot send an invitation to user-to-invite@users.gov.uk because they have received one already, or may be an existing team member' }
      })
    })
  })
})
