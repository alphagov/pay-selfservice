const sinon = require('sinon')
const proxyquire = require('proxyquire')

const userFixtures = require('../../../../test/fixtures/user.fixtures')
const User = require('../../../models/User.class')
const paths = require('../../../paths')

const userExternalId = 'user-id'
const correlationId = 'correlation-id'

describe('Select new second factor method post controller', () => {
  let req, res, next
  const provisionNewOtpKeySpy = sinon.spy(() => Promise.resolve())
  const sendProvisionalOtpSpy = sinon.spy(() => Promise.resolve())
  const controllerWithAdminusersSuccessSpies = getController(provisionNewOtpKeySpy, sendProvisionalOtpSpy)

  beforeEach(() => {
    req = {
      correlationId,
      body: {},
      flash: sinon.spy()
    }
    res = {
      redirect: sinon.spy()
    }
    next = sinon.spy()
    provisionNewOtpKeySpy.resetHistory()
    sendProvisionalOtpSpy.resetHistory()
  })

  describe('The user selects SMS as the new method', () => {
    describe('The user has a phone number set', () => {
      it('should make requests to adminusers and redirect to configure page', async () => {
        req.user = new User(userFixtures.validUserResponse({
          external_id: userExternalId,
          telephone_number: '+441134960000'
        }))
        req.body['two-fa-method'] = 'SMS'

        await controllerWithAdminusersSuccessSpies(req, res, next)

        sinon.assert.calledWith(provisionNewOtpKeySpy, userExternalId, correlationId)
        sinon.assert.calledWith(sendProvisionalOtpSpy, userExternalId, correlationId)
        sinon.assert.calledWith(res.redirect, paths.user.profile.twoFactorAuth.configure)
      })
    })

    describe('The user does not have a phone number set', () => {
      it('should redirect to phone number page', async () => {
        req.user = new User(userFixtures.validUserResponse({
          external_id: userExternalId,
          telephone_number: null
        }))
        req.body['two-fa-method'] = 'SMS'

        await controllerWithAdminusersSuccessSpies(req, res, next)

        sinon.assert.calledWith(res.redirect, paths.user.profile.twoFactorAuth.phoneNumber)
        sinon.assert.notCalled(provisionNewOtpKeySpy)
        sinon.assert.notCalled(sendProvisionalOtpSpy)
      })
    })
  })

  describe('The user selects APP as the new method', () => {
    it('should call adminusers and redirect to the configure page', async () => {
      req.user = new User(userFixtures.validUserResponse({
        external_id: userExternalId
      }))
      req.body['two-fa-method'] = 'APP'

      await controllerWithAdminusersSuccessSpies(req, res, next)

      sinon.assert.calledWith(provisionNewOtpKeySpy, userExternalId, correlationId)
      sinon.assert.calledWith(res.redirect, paths.user.profile.twoFactorAuth.configure)
      sinon.assert.notCalled(sendProvisionalOtpSpy)
    })
  })

  describe('There is an error contacting adminusers', () => {
    it('should call next with an error', async () => {
      req.user = new User(userFixtures.validUserResponse({
        external_id: userExternalId
      }))
      req.body['two-fa-method'] = 'APP'

      const error = new Error('Error from adminusers')
      const adminusersRejectsStub = () => Promise.reject(error)
      const controllerWithAdminusersError = getController(adminusersRejectsStub, sendProvisionalOtpSpy)

      await controllerWithAdminusersError(req, res, next)

      sinon.assert.calledWith(next, error)
      sinon.assert.notCalled(res.redirect)
    })
  })

  function getController (provisionNewOtpKeySpy, sendProvisionalOtpSpy) {
    return proxyquire('./post-index.controller', {
      '../../../services/user.service.js': {
        provisionNewOtpKey: provisionNewOtpKeySpy,
        sendProvisionalOTP: sendProvisionalOtpSpy
      }
    })
  }
})
