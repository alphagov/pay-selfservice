const sinon = require('sinon')
const proxyquire = require('proxyquire')

const userFixtures = require('../../../../test/fixtures/user.fixtures')
const User = require('../../../models/User.class')
const paths = require('../../../paths')
const { validationErrors } = require('../../../utils/validation/field-validation-checks')

const userExternalId = 'user-id'

describe('The POST resend code for updating 2FA to SMS controller', () => {
  let req, res, next
  const updatePhoneNumberSpy = sinon.spy(() => Promise.resolve())
  const sendProvisionalOTPSpy = sinon.spy(() => Promise.resolve())
  const controllerWithAdminusersSuccess = getController(updatePhoneNumberSpy, sendProvisionalOTPSpy)

  beforeEach(() => {
    req = {
      user: new User(userFixtures.validUserResponse({ external_id: userExternalId })),
      body: {},
      flash: sinon.spy()
    }
    res = {
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
    updatePhoneNumberSpy.resetHistory()
    sendProvisionalOTPSpy.resetHistory()
  })

  describe('A valid phone number is entered', () => {
    beforeEach(() => {
      req.body.phone = '+441234567890'
    })

    describe('Requests to adminusers succeed', () => {
      it('should make requests to adminusers then redirect with flash message', async () => {
        await controllerWithAdminusersSuccess(req, res, next)

        sinon.assert.calledWith(updatePhoneNumberSpy, userExternalId, req.body.phone)
        sinon.assert.calledWith(sendProvisionalOTPSpy, userExternalId)
        sinon.assert.calledWith(req.flash, 'generic', 'Another verification code has been sent to your phone')
        sinon.assert.calledWith(res.redirect, paths.user.profile.twoFactorAuth.configure)
      })
    })

    describe('Request to adminusers fails', () => {
      it('should call next with the error', async () => {
        const error = new Error('An error')
        const updatePhoneNumberErrorSpy = sinon.spy(() => Promise.reject(error))

        const controllerWithAdminusersError = getController(updatePhoneNumberErrorSpy, sendProvisionalOTPSpy)
        await controllerWithAdminusersError(req, res, next)

        sinon.assert.calledWith(updatePhoneNumberErrorSpy, userExternalId, req.body.phone)
        sinon.assert.notCalled(sendProvisionalOTPSpy)
        sinon.assert.calledWith(next, error)
      })
    })
  })

  describe('An invalid phone number is entered', () => {
    it('should render the resend code page with an error', async () => {
      req.body.phone = 'invalid-phone'

      await controllerWithAdminusersSuccess(req, res, next)

      sinon.assert.calledWithMatch(res.render, 'two-factor-auth/resend-sms-code', {
        phone: req.body.phone,
        errors: {
          phone: validationErrors.invalidTelephoneNumber
        }
      })

      sinon.assert.notCalled(updatePhoneNumberSpy)
      sinon.assert.notCalled(sendProvisionalOTPSpy)
    })
  })
})

function getController (updatePhoneNumberSpy, sendProvisionalOTPSpy) {
  return proxyquire('./post-resend.controller', {
    '../../../services/user.service': {
      updatePhoneNumber: updatePhoneNumberSpy,
      sendProvisionalOTP: sendProvisionalOTPSpy
    }
  })
}
