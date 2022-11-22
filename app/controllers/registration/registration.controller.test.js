const proxyquire = require('proxyquire')
const sinon = require('sinon')

const inviteFixtures = require('../../../test/fixtures/invite.fixtures')
const { RegistrationSessionMissingError } = require('../../errors')
const { paths } = require('../../routes')
const registrationController = require('./registration.controller')

const inviteCode = 'a-code'
let req, res, next

const qrCodeDataUrl = 'data:image/png;base64,somedata'

describe('Registration', () => {
  beforeEach(() => {
    req = {
      register_invite: {
        code: inviteCode,
        email: 'foo@example.com'
      }
    }
    res = {
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  describe('show the password page', () => {
    it('should call next with an error when the registration cookie is not set', async () => {
      delete req.register_invite
      await registrationController.showPasswordPage(req, res, next)

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

  describe('submit the password page', () => {
    it('should call next with an error when the registration cookie is not set', async () => {
      delete req.register_invite
      await registrationController.submitPasswordPage(req, res, next)

      sinon.assert.calledWith(next, sinon.match.instanceOf(RegistrationSessionMissingError))
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
    })

    it('should render the password page with an error when both password fields are empty', async () => {
      req.body = {
        password: '',
        'repeat-password': ''
      }
      await registrationController.submitPasswordPage(req, res, next)

      sinon.assert.calledWith(res.render, 'registration/password', {
        errors: {
          password: 'Enter a password',
          'repeat-password': 'Re-type your password'
        }
      })
    })

    it('should render the password page with an error when the password does not meet the requirements', async () => {
      req.body = {
        password: 'too-short',
        'repeat-password': 'too-short'
      }
      await registrationController.submitPasswordPage(req, res, next)

      sinon.assert.calledWith(res.render, 'registration/password', {
        errors: {
          password: 'Password must be 10 characters or more'
        }
      })
    })

    it('should render the password page with an error when the password is valid but the repeat password field is blank', async () => {
      req.body = {
        password: 'this-is-long-enough',
        'repeat-password': ''
      }
      await registrationController.submitPasswordPage(req, res, next)

      sinon.assert.calledWith(res.render, 'registration/password', {
        errors: {
          'repeat-password': 'Re-type your password'
        }
      })
    })

    it('should render the password page with an error when the repeat password field does not match', async () => {
      req.body = {
        password: 'this-is-long-enough',
        'repeat-password': 'something-else'
      }
      await registrationController.submitPasswordPage(req, res, next)

      sinon.assert.calledWith(res.render, 'registration/password', {
        errors: {
          password: 'Enter same password in both fields',
          'repeat-password': 'Enter same password in both fields'
        }
      })
    })

    it('should call next with an error if adminusers returns an error', async () => {
      const validPassword = 'this-is-long-enough'
      req.body = {
        password: validPassword,
        'repeat-password': validPassword
      }

      const error = new Error('error from adminusers')
      const updateInvitePasswordSpy = sinon.spy(() => Promise.reject(error))
      const controller = getControllerWithMockedAdminusersClient({
        updateInvitePassword: updateInvitePasswordSpy
      })

      await controller.submitPasswordPage(req, res, next)
      sinon.assert.calledWith(updateInvitePasswordSpy, inviteCode, validPassword)
      sinon.assert.calledWith(next, error)
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
    })

    it('should redirect to next page if updated password successfully', async () => {
      const validPassword = 'this-is-long-enough'
      req.body = {
        password: validPassword,
        'repeat-password': validPassword
      }

      const updateInvitePasswordSpy = sinon.spy(() => Promise.resolve())
      const controller = getControllerWithMockedAdminusersClient({
        updateInvitePassword: updateInvitePasswordSpy
      })

      await controller.submitPasswordPage(req, res, next)
      sinon.assert.calledWith(updateInvitePasswordSpy, inviteCode, validPassword)
      sinon.assert.calledWith(res.redirect, paths.register.securityCodes)
      sinon.assert.notCalled(next)
      sinon.assert.notCalled(res.render)
    })
  })

  describe('submit the choose how to get security codes page', () => {
    it('should render page with an error when an option is not selected', () => {
      req.body = {
        'sign-in-method': ''
      }
      registrationController.submitChooseSignInMethodPage(req, res)
      sinon.assert.calledWith(res.render, 'registration/get-security-codes', {
        errors: {
          'sign-in-method': 'You need to select an option'
        }
      })
      sinon.assert.notCalled(res.redirect)
    })

    it('should redirect to the phone number page when SMS is chosen', () => {
      req.body = {
        'sign-in-method': 'SMS'
      }
      registrationController.submitChooseSignInMethodPage(req, res)
      sinon.assert.calledWith(res.redirect, paths.register.phoneNumber)
      sinon.assert.notCalled(res.render)
    })

    it('should redirect to the authenticator app page when APP is chosen', () => {
      req.body = {
        'sign-in-method': 'APP'
      }
      registrationController.submitChooseSignInMethodPage(req, res)
      sinon.assert.calledWith(res.redirect, paths.register.authenticatorApp)
      sinon.assert.notCalled(res.render)
    })
  })

  describe('show the authenticator app page', () => {
    it('should call next with an error when the registration cookie is not set', async () => {
      delete req.register_invite
      await registrationController.showAuthenticatorAppPage(req, res, next)

      sinon.assert.calledWith(next, sinon.match.instanceOf(RegistrationSessionMissingError))
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
    })

    it('should call next with an error if adminusers returns an error', async () => {
      const error = new Error('error from adminusers')
      const controller = getControllerWithMockedAdminusersClient({
        getValidatedInvite: () => Promise.reject(error)
      })

      await controller.showAuthenticatorAppPage(req, res, next)
      sinon.assert.calledWith(next, error)
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
    })

    it('should render the page when invite successfully retrieved from adminusers', async () => {
      const otpKey = 'ANEXAMPLESECRETSECONDFACTORCODE1'
      const invite = inviteFixtures.validInviteResponse({ otp_key: otpKey })
      const controller = getControllerWithMockedAdminusersClient({
        getValidatedInvite: () => Promise.resolve(invite)
      })

      await controller.showAuthenticatorAppPage(req, res, next)
      sinon.assert.calledWith(res.render, 'registration/authenticator-app', {
        prettyPrintedSecret: 'ANEX AMPL ESEC RETS ECON DFAC TORC ODE1',
        qrCodeDataUrl
      })
      sinon.assert.notCalled(next)
      sinon.assert.notCalled(res.redirect)
    })
  })
})

function getControllerWithMockedAdminusersClient (mockedAdminusersClient) {
  return proxyquire('./registration.controller.js', {
    '../../services/clients/adminusers.client': () => mockedAdminusersClient,
    'qrcode': { toDataURL: () => Promise.resolve(qrCodeDataUrl) }
  })
}
