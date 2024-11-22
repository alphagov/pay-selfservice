const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')
const paths = require('@root/paths')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

let req, res, responseStub, renderErrorViewStub, findByExternalIdStub, updateServiceRoleStub, changePermissionController

const getController = (stubs = {}) => {
  return proxyquire('./change-permission.controller', {
    '@utils/response': { response: stubs.response, renderErrorView: stubs.renderErrorView },
    '@services/user.service':
      { findByExternalId: stubs.findByExternalId, updateServiceRole: stubs.updateServiceRole }
  })
}

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

const setupTest = (method, userToChangePermission, additionalReqProps = {}) => {
  responseStub = sinon.spy()
  renderErrorViewStub = sinon.spy()
  findByExternalIdStub = sinon.stub().resolves(userToChangePermission)
  updateServiceRoleStub = sinon.stub().resolves({})

  changePermissionController = getController({
    response: responseStub,
    findByExternalId: findByExternalIdStub,
    updateServiceRole: updateServiceRoleStub,
    renderErrorView: renderErrorViewStub
  })
  res = {
    redirect: sinon.spy()
  }
  req = {
    user: adminUser,
    service: {
      externalId: SERVICE_ID
    },
    account: {
      type: ACCOUNT_TYPE
    },
    ...additionalReqProps
  }
  changePermissionController[method](req, res)
}

describe('Controller: settings/team-members/change-permission', () => {
  describe('get', () => {
    describe('success', () => {
      before(() => setupTest('get', viewOnlyUser, { params: { externalUserId: 'user-id-to-change-permission' } }))

      it('should call the response method', () => {
        expect(findByExternalIdStub.called).to.be.true // eslint-disable-line
        expect(responseStub.called).to.be.true // eslint-disable-line
      })

      it('should pass req, res and template path to the response method', () => {
        expect(responseStub.args[0]).to.include(req)
        expect(responseStub.args[0]).to.include(res)
        expect(responseStub.args[0]).to.include('simplified-account/settings/team-members/change-permission')
      })

      it('should pass context data to the response method', () => {
        expect(responseStub.args[0][3]).to.have.property('availableRoles').to.have.length(3)
        expect(responseStub.args[0][3]).to.have.property('serviceHasAgentInitiatedMotoEnabled').to.be.false // eslint-disable-line no-unused-expressions
        expect(responseStub.args[0][3]).to.have.property('userCurrentRoleName').to.equal('view-only')
        expect(responseStub.args[0][3]).to.have.property('email').to.equal('user-to-change-permission@users.gov.uk')
        expect(responseStub.args[0][3]).to.have.property('backLink').to.equal('/simplified/service/service-id-123abc/account/test/settings/team-members')
      })
    })

    describe('failure - admin attempts to change own permissions', () => {
      before(() => setupTest('get', adminUser, { params: { externalUserId: 'user-id-for-admin-user' } }))

      it('should call the renderErrorView method', () => {
        sinon.assert.calledWith(renderErrorViewStub, req, res, 'You cannot update your own permissions', 403)
      })
    })
  })

  describe('post', () => {
    describe('admin user selects a new role for the user', () => {
      before(() => setupTest('post', viewOnlyUser,
        {
          params: { externalUserId: 'user-id-to-change-permission' },
          body: { newRole: 'view-and-refund' },
          flash: sinon.stub()
        }
      ))

      it('should call the update service role method with the new role', () => {
        expect(updateServiceRoleStub.calledWith('user-id-to-change-permission', 'view-and-refund', SERVICE_ID)).to.be.true // eslint-disable-line
      })

      it('should redirect to the team members index page with notification', () => {
        sinon.assert.calledWith(req.flash, 'messages', {
          state: 'success',
          icon: '&check;',
          heading: 'Permissions have been updated'
        })
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.teamMembers.index)
      })
    })

    describe('admin user selects users current role', () => {
      before(() => setupTest('post', viewOnlyUser,
        {
          params: { externalUserId: 'user-id-to-change-permission' },
          body: { newRole: 'view-only' },
          flash: sinon.stub()
        }
      ))
      it('should not attempt to update and should redirect to the team members index page without a notification', () => {
        expect(updateServiceRoleStub.called).to.be.false // eslint-disable-line
        expect(req.flash.called).to.be.false // eslint-disable-line
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.teamMembers.index)
      })
    })

    describe('failure - admin attempts to change own permissions', () => {
      before(() => setupTest('post', adminUser,
        {
          params: { externalUserId: 'user-id-for-admin-user' },
          body: { newRole: 'view-and-refund' },
          flash: sinon.stub()
        }))

      it('should call the renderErrorView method', () => {
        sinon.assert.calledWith(renderErrorViewStub, req, res, 'You cannot update your own permissions', 403)
      })
    })
  })
})
