const proxyquire = require('proxyquire')
const sinon = require('sinon')

const inviteFixtures = require('../../../test/fixtures/invite.fixtures')
const { RegistrationSessionMissingError } = require('../../errors')
const { paths } = require('../../routes')

let req, res, next

describe('Registration', () => {
  beforeEach(() => {
    req = {
      register_invite: {
        code: 'a-code',
        email: 'foo@example.com'
      }
    }
    res = {
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  describe('show password page', () => {
    it('should call next with an error when the registration cookie is not set', async () => {
      delete req.register_invite
      const controller = getControllerWithMockedAdminusersClient({})
      await controller.showPasswordPage(req, res, next)

      sinon.assert.calledWith(next, sinon.match.instanceOf(RegistrationSessionMissingError))
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
    })

    it('should redirect to security codes page when password is already set for invite', async () => {
      const inviteWithPasswordSet = inviteFixtures.validInviteResponse({ password_set: true })
      const controller = getControllerWithMockedAdminusersClient({
        getValidatedInvite: () => Promise.resolve(inviteWithPasswordSet)
      })

      await controller.showPasswordPage(req, res, next)
      sinon.assert.calledWith(res.redirect, paths.register.securityCodes)
      sinon.assert.notCalled(next)
      sinon.assert.notCalled(res.render)
    })

    it('should render password page when password is not set for invite', async () => {
      const inviteWithPasswordNotSet = inviteFixtures.validInviteResponse({ password_set: false })
      const controller = getControllerWithMockedAdminusersClient({
        getValidatedInvite: () => Promise.resolve(inviteWithPasswordNotSet)
      })

      await controller.showPasswordPage(req, res, next)
      sinon.assert.calledWith(res.render, 'registration/password')
      sinon.assert.notCalled(next)
      sinon.assert.notCalled(res.redirect)
    })

    it('should call next with an error if adminusers returns an error', async () => {
      const error = new Error('error from adminusers')
      const controller = getControllerWithMockedAdminusersClient({
        getValidatedInvite: () => Promise.reject(error)
      })

      await controller.showPasswordPage(req, res, next)
      sinon.assert.calledWith(next, error)
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
    })
  })
})

function getControllerWithMockedAdminusersClient (mockedAdminusersClient) {
  return proxyquire('./registration.controller.js', {
    '../../services/clients/adminusers.client': () => mockedAdminusersClient
  })
}
