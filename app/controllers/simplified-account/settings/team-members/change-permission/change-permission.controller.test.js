const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

let req, res, responseStub, findByExternalIdStub, changePermissionController

const getController = (stubs = {}) => {
  return proxyquire('./change-permission.controller', {
    '@utils/response': { response: stubs.response },
    '@services/user.service':
      { findByExternalId: stubs.findByExternalId }
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
  findByExternalIdStub = sinon.stub().resolves(userToChangePermission)

  changePermissionController = getController({
    response: responseStub,
    findByExternalId: findByExternalIdStub
  })
  res = {
    setHeader: sinon.stub(),
    status: sinon.spy(),
    render: sinon.spy(),
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

      it('should call the render method with an error', () => {
        sinon.assert.calledWith(res.status, 403)
        sinon.assert.calledWith(res.render, 'error', sinon.match({ message: 'You cannot update your own permissions' }))
      })
    })
  })
})
