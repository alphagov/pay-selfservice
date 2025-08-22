const sinon = require('sinon')
const { expect } = require('chai')
const User = require('@models/user/User.class')
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

const mockResponse = sinon.stub()
const mockCreateInviteToJoinService = sinon.stub()

const { req, res, nextRequest, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/team-members/invite/invite.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/user.service': { createInviteToJoinService: mockCreateInviteToJoinService }
  })
  .withUser(adminUser)
  .build()

describe('Controller: settings/team-members/invite', () => {
  describe('get', () => {
    beforeEach(async () => {
      await call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/team-members/invite')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('availableRoles').to.have.length(3)
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal('/service/service-id-123abc/account/test/settings/team-members')
    })
  })
})

describe('post', () => {
  describe('success', () => {
    beforeEach(async () => {
      nextRequest({
        body: { invitedUserEmail: 'user-to-invite@users.gov.uk', invitedUserRole: 'view-only' }
      })
      mockCreateInviteToJoinService.resolves()
      await call('post')
    })

    it('should call adminusers to send an invite', () => {
      expect(mockCreateInviteToJoinService.calledWith('user-to-invite@users.gov.uk', adminUser.externalId, SERVICE_ID, 'view-only')).to.be.true
    })

    it('should redirect to the team members index page', () => {
      expect(req.flash).to.have.been.calledWith('messages', {
        state: 'success',
        icon: '&check;',
        heading: 'Team member invitation sent to user-to-invite@users.gov.uk'
      })
      expect(res.redirect.calledOnce).to.be.true
      expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.teamMembers.index)
    })
  })

  describe('failure - user already in service', () => {
    beforeEach(async () => {
      nextRequest({
        body: { invitedUserEmail: 'user-to-invite@users.gov.uk', invitedUserRole: 'view-only' }
      })
      mockCreateInviteToJoinService.rejects(new RESTClientError(null, 'adminusers', 412))
      await call('post')
    })

    it('should respond with error message', () => {
      expect(mockCreateInviteToJoinService.calledWith('user-to-invite@users.gov.uk', adminUser.externalId, SERVICE_ID, 'view-only')).to.be.true
      expect(mockResponse.calledOnce).to.be.true
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/team-members/invite')
      expect(mockResponse.args[0][3]).to.have.property('errors').to.deep.equal({
        summary: [{ text: 'This person has already been invited', href: '#invited-user-email' }],
        formErrors: { invitedUserEmail: 'You cannot send an invitation to user-to-invite@users.gov.uk because they have received one already, or may be an existing team member' }
      })
    })
  })
})
