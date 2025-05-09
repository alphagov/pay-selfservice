const sinon = require('sinon')
const { expect } = require('chai')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')
const paths = require('@root/paths')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')

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

const viewOnlyUser = new User(userFixtures.validUserResponse(
  {
    external_id: 'user-id-to-remove',
    email: 'user-to-remove@users.gov.uk',
    service_roles: {
      service:
        {
          service: { external_id: SERVICE_ID },
          role: { name: 'view-only' }
        }
    }
  }))

const mockResponse = sinon.spy()
const mockRenderErrorView = sinon.spy()
const mockFindByExternalId = sinon.stub()
const mockDelete = sinon.stub().returns({ })

const { req, res, nextRequest, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/team-members/remove-user/remove-user.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse, renderErrorView: mockRenderErrorView },
    '@services/user.service': { findByExternalId: mockFindByExternalId, delete: mockDelete }
  })
  .withUser(adminUser)
  .build()

describe('Controller: settings/team-members/remove-user', () => {
  describe('get', () => {
    describe('success', () => {
      before(() => {
        mockFindByExternalId.resolves(viewOnlyUser)
        nextRequest({
          params: { externalUserId: 'user-id-to-remove' }
        })
        call('get')
      })

      it('should call the response method', () => {
        expect(mockFindByExternalId.called).to.be.true
        expect(mockResponse.called).to.be.true
      })

      it('should pass req, res, template path and context to the response method', () => {
        expect(mockResponse).to.have.been.calledWith(
          { ...req, params: { externalUserId: 'user-id-to-remove' } },
          res,
          'simplified-account/settings/team-members/remove-user',
          {
            email: 'user-to-remove@users.gov.uk',
            backLink: '/service/service-id-123abc/account/test/settings/team-members'
          })
      })
    })

    describe('failure - admin attempts to remove self', () => {
      before(() => {
        mockFindByExternalId.resolves(adminUser)
        nextRequest({
          params: { externalUserId: 'user-id-for-admin-user' }
        })
        call('get')
      })

      it('should call the renderErrorView method', () => {
        sinon.assert.calledWith(
          mockRenderErrorView, { ...req, params: { externalUserId: 'user-id-for-admin-user' } }, res, 'You cannot remove yourself from a service', 403)
      })
    })
  })

  describe('post', () => {
    describe('admin user confirmed remove user', () => {
      before(() => {
        mockFindByExternalId.resolves(adminUser)
        nextRequest({
          params: { externalUserId: 'user-id-to-remove' },
          body: { email: 'user-to-remove@users.gov.uk', confirmRemoveUser: 'yes' }
        })
        call('post')
      })

      it('should remove the user from the service', () => {
        expect(mockDelete.calledWith(SERVICE_ID, 'user-id-for-admin-user', 'user-id-to-remove')).to.be.true
      })

      it('should redirect to the team members index page', () => {
        sinon.assert.calledWith(req.flash, 'messages', {
          state: 'success',
          icon: '&check;',
          heading: 'Successfully removed user-to-remove@users.gov.uk'
        })
        expect(res.redirect.calledOnce).to.be.true
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.teamMembers.index)
      })
    })

    describe('admin user selected not to remove user', () => {
      before(() => {
        mockFindByExternalId.resolves(viewOnlyUser)
        nextRequest({
          params: { externalUserId: 'user-id-to-remove' },
          body: { email: 'user-to-remove@users.gov.uk', confirmRemoveUser: 'no' }
        })
        call('post')
      })

      it('should redirect to the team members page without deleting the user', () => {
        expect(res.redirect.calledOnce).to.be.true
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.teamMembers.index)
        expect(mockDelete.called).to.be.false
      })
    })

    describe('admin user attempted to remove self', () => {
      before(() => {
        mockFindByExternalId.resolves(adminUser)
        nextRequest({
          params: { externalUserId: 'user-id-for-admin-user' },
          body: { email: 'admin-user@users.gov.uk', confirmRemoveUser: 'yes' }
        })
        call('post')
      })

      it('should call the renderErrorView method', () => {
        sinon.assert.calledWith(
          mockRenderErrorView,
          {
            ...req,
            params: { externalUserId: 'user-id-for-admin-user' },
            body: { email: 'admin-user@users.gov.uk', confirmRemoveUser: 'yes' }
          },
          res,
          'You cannot remove yourself from a service',
          403
        )
      })
    })
  })
})
