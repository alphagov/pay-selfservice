const sinon = require('sinon')
const { expect } = require('chai')
const User = require('@models/user/User.class')
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
    external_id: 'user-id-to-change-permission',
    email: 'user-to-change-permission@users.gov.uk',
    service_roles: {
      service:
        {
          service: { external_id: SERVICE_ID },
          role: { name: 'view-only' }
        }
    }
  }))

const mockResponse = sinon.stub()
const mockRenderErrorView = sinon.spy()
const mockFindByExternalId = sinon.stub()
const mockUpdateServiceRole = sinon.stub().resolves({})

const { req, res, nextRequest, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/team-members/change-permission/change-permission.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse, renderErrorView: mockRenderErrorView },
    '@services/user.service': { findByExternalId: mockFindByExternalId, updateServiceRole: mockUpdateServiceRole }
  })
  .withUser(adminUser)
  .build()

describe('Controller: settings/team-members/change-permission', () => {
  describe('get', () => {
    describe('success', () => {
      beforeEach(async () => {
        mockFindByExternalId.resolves(viewOnlyUser)
        nextRequest({
          params: { externalUserId: 'user-id-to-change-permission' }
        })
        await call('get')
      })

      it('should call the response method', () => {
        expect(mockFindByExternalId.called).to.be.true
        expect(mockResponse.called).to.be.true
      })

      it('should pass req, res and template path to the response method', () => {
        expect(mockResponse.args[0]).to.deep.include({ ...req, params: { externalUserId: 'user-id-to-change-permission' } })
        expect(mockResponse.args[0]).to.include(res)
        expect(mockResponse.args[0]).to.include('simplified-account/settings/team-members/change-permission')
      })

      it('should pass context data to the response method', () => {
        expect(mockResponse.args[0][3]).to.have.property('availableRoles').to.have.length(3)
        expect(mockResponse.args[0][3]).to.have.property('userCurrentRoleName').to.equal('view-only')
        expect(mockResponse.args[0][3]).to.have.property('email').to.equal('user-to-change-permission@users.gov.uk')
        expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal('/service/service-id-123abc/account/test/settings/team-members')
      })
    })
    describe('failure - admin attempts to change own permissions', () => {
      beforeEach(async () => {
        mockFindByExternalId.resolves(adminUser)
        nextRequest({
          params: { externalUserId: 'user-id-for-admin-user' }
        })
        await call('get')
      })

      it('should call the renderErrorView method', () => {
        sinon.assert.calledWith(
          mockRenderErrorView, { ...req, params: { externalUserId: 'user-id-for-admin-user' } }, res, 'You cannot update your own permissions', 403)
      })
    })
  })
  describe('post', () => {
    describe('admin user selects a new role for the user', () => {
      beforeEach(async () => {
        mockFindByExternalId.resolves(viewOnlyUser)
        nextRequest({
          params: { externalUserId: 'user-id-to-change-permission' },
          body: { newRole: 'view-and-refund' }
        })
        await call('post')
      })

      it('should call the update service role method with the new role', () => {
        expect(mockUpdateServiceRole.calledWith('user-id-to-change-permission', 'view-and-refund', SERVICE_ID)).to.be.true
      })

      it('should redirect to the team members index page with notification', () => {
        sinon.assert.calledWith(req.flash, 'messages', {
          state: 'success',
          icon: '&check;',
          heading: 'Permissions have been updated'
        })
        expect(res.redirect.calledOnce).to.be.true
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.teamMembers.index)
      })
    })
    describe('admin user selects users current role', () => {
      beforeEach(async () => {
        mockFindByExternalId.resolves(viewOnlyUser)
        nextRequest({
          params: { externalUserId: 'user-id-to-change-permission' },
          body: { newRole: 'view-only' }
        })
        await call('post')
      })

      it('should not attempt to update and should redirect to the team members index page without a notification', () => {
        expect(mockUpdateServiceRole.called).to.be.false
        expect(req.flash.called).to.be.false
        expect(res.redirect.calledOnce).to.be.true
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.teamMembers.index)
      })
    })
    describe('failure - admin attempts to change own permissions', () => {
      beforeEach(async () => {
        mockFindByExternalId.resolves(adminUser)
        nextRequest({
          params: { externalUserId: 'user-id-for-admin-user' },
          body: { newRole: 'view-and-refund' }
        })
        await call('post')
      })

      it('should call the renderErrorView method', () => {
        sinon.assert.calledWith(
          mockRenderErrorView,
          { ...req, params: { externalUserId: 'user-id-for-admin-user' }, body: { newRole: 'view-and-refund' } },
          res,
          'You cannot update your own permissions',
          403
        )
      })
    })
  })
})
