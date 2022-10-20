const sinon = require('sinon')
const proxyquire = require('proxyquire')

const userFixtures = require('../../../../test/fixtures/user.fixtures')
const User = require('../../../models/User.class')
const paths = require('../../../paths')
const { validationErrors } = require('../../../utils/validation/field-validation-checks')

const userExternalId = 'user-id'
const correlationId = 'correlation-id'

describe('The POST set phone number for updating 2FA method controller', () => {
  let req, res, next
  const updatePhoneNumberSpy = sinon.spy(() => Promise.resolve())
  const provisionNewOtpKeySpy = sinon.spy(() => Promise.resolve())
  const sendProvisionalOTPSpy = sinon.spy(() => Promise.resolve())
  const controllerWithAdminusersSuccess = getController(updatePhoneNumberSpy, provisionNewOtpKeySpy, sendProvisionalOTPSpy)

  beforeEach(() => {
    req = {
      correlationId,
      user: new User(userFixtures.validUserResponse({ external_id: userExternalId })),
      body: {}
    }
    res = {
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
    updatePhoneNumberSpy.resetHistory()
    provisionNewOtpKeySpy.resetHistory()
    sendProvisionalOTPSpy.resetHistory()
  })

  describe('A valid phone number is entered', () => {
    beforeEach(() => {
      req.body.phone = '+441234567890'
    })

    describe('Requests to adminusers succeed', () => {
      it('should make requests to adminusers then redirect', async () => {
        await controllerWithAdminusersSuccess(req, res, next)

        sinon.assert.calledWith(updatePhoneNumberSpy, userExternalId, req.body.phone, correlationId)
        sinon.assert.calledWith(provisionNewOtpKeySpy, userExternalId, correlationId)
        sinon.assert.calledWith(sendProvisionalOTPSpy, userExternalId, correlationId)
        sinon.assert.calledWith(res.redirect, paths.user.profile.twoFactorAuth.configure)
      })
    })

    describe('Request to adminusers fails', () => {
      it('should make requests to adminusers then redirect', async () => {
        const error = new Error('An error')
        const updatePhoneNumberErrorSpy = sinon.spy(() => Promise.reject(error))

        const controllerWithAdminusersError = getController(updatePhoneNumberErrorSpy, provisionNewOtpKeySpy, sendProvisionalOTPSpy)
        await controllerWithAdminusersError(req, res, next)

        sinon.assert.calledWith(updatePhoneNumberErrorSpy, userExternalId, req.body.phone, correlationId)
        sinon.assert.notCalled(provisionNewOtpKeySpy)
        sinon.assert.notCalled(sendProvisionalOTPSpy)
        sinon.assert.calledWith(next, error)
      })
    })
  })

  describe('An invalid phone number is entered', () => {
    it('should render the phone number page with an error', async () => {
      req.body.phone = 'invalid-phone'

      await controllerWithAdminusersSuccess(req, res, next)

      sinon.assert.calledWithMatch(res.render, 'two-factor-auth/phone-number', {
        phone: req.body.phone,
        errors: {
          phone: validationErrors.invalidTelephoneNumber
        }
      })

      sinon.assert.notCalled(updatePhoneNumberSpy)
      sinon.assert.notCalled(provisionNewOtpKeySpy)
      sinon.assert.notCalled(sendProvisionalOTPSpy)
    })
  })
})

function getController (updatePhoneNumberSpy, provisionNewOtpKeySpy, sendProvisionalOTPSpy) {
  return proxyquire('./post-phone-number.controller', {
    '../../../services/user.service': {
      updatePhoneNumber: updatePhoneNumberSpy,
      provisionNewOtpKey: provisionNewOtpKeySpy,
      sendProvisionalOTP: sendProvisionalOTPSpy
    }
  })
}
