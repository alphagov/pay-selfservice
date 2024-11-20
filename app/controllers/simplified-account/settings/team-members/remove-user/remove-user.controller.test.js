const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')
const paths = require('@root/paths')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

let req, res, responseStub, findByExternalIdStub, deleteStub, removeUserController

const getController = (stubs = {}) => {
  return proxyquire('./remove-user.controller', {
    '@utils/response': { response: stubs.response },
    '@services/user.service':
      { findByExternalId: stubs.findByExternalId, delete: stubs.delete }
  })
}

const setupTest = (method, additionalReqProps = {}) => {
  responseStub = sinon.spy()
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
  const userToRemove = new User(userFixtures.validUserResponse(
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
  findByExternalIdStub = sinon.stub().resolves(userToRemove)
  deleteStub = sinon.stub().returns({ })

  removeUserController = getController({
    response: responseStub,
    findByExternalId: findByExternalIdStub,
    delete: deleteStub
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
  removeUserController[method](req, res)
}

describe('Controller: settings/team-members/remove-user', () => {
  describe('get', () => {
    describe('success', () => {
      before(() => setupTest('get', { params: { externalUserId: 'user-id-to-remove' } }))

      it('should call the response method', () => {
        expect(findByExternalIdStub.called).to.be.true // eslint-disable-line
        expect(responseStub.called).to.be.true // eslint-disable-line
      })

      it('should pass req, res and template path to the response method', () => {
        expect(responseStub.args[0]).to.include(req)
        expect(responseStub.args[0]).to.include(res)
        expect(responseStub.args[0]).to.include('simplified-account/settings/team-members/remove-user')
      })

      it('should pass context data to the response method', () => {
        expect(responseStub.args[0][3]).to.have.property('email').to.equal('user-to-remove@users.gov.uk')
        expect(responseStub.args[0][3]).to.have.property('backLink').to.equal('/simplified/service/service-id-123abc/account/test/settings/team-members')
      })
    })
  })

  describe('post', () => {
    describe('admin user confirmed remove user', () => {
      before(() => setupTest('post',
        {
          params: { externalUserId: 'user-id-to-remove' },
          body: { email: 'user-to-remove@users.gov.uk', confirmRemoveUser: 'yes' },
          flash: sinon.stub()
        }
      ))

      it('should remove the user from the service', () => {
        expect(deleteStub.calledWith(SERVICE_ID, 'user-id-for-admin-user', 'user-id-to-remove')).to.be.true // eslint-disable-line
      })

      it('should redirect to the team members index page', () => {
        sinon.assert.calledWith(req.flash, 'messages', {
          state: 'success',
          icon: '&check;',
          heading: 'Successfully removed user-to-remove@users.gov.uk'
        })
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.teamMembers.index)
      })
    })

    describe('admin user selected not to remove user', () => {
      before(() => setupTest('post',
        {
          params: { externalUserId: 'user-id-to-remove' },
          body: { email: 'user-to-remove@users.gov.uk', confirmRemoveUser: 'no' },
          flash: sinon.stub()
        }
      ))

      it('should redirect to the team members page without deleting the user', () => {
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.teamMembers.index)
        expect(deleteStub.called).to.be.false // eslint-disable-line
      })
    })
  })
})
