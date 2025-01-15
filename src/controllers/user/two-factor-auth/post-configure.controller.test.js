const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { expect } = require('chai')

const userFixtures = require('../../../../test/fixtures/user.fixtures')
const User = require('../../../models/User.class')
const paths = require('../../../paths')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')
const secondFactorMethod = require('../../../models/second-factor-method')

const userExternalId = 'user-id'
const twoFactorAuthMethod = secondFactorMethod.SMS

describe('Configure new second factor method post controller', () => {
  let req, res, next
  const configureNewOtpKeySpy = sinon.spy(() => Promise.resolve())
  const controllerWithAdminusersSuccess = getController(configureNewOtpKeySpy)

  beforeEach(() => {
    req = {
      user: new User(userFixtures.validUserResponse({ external_id: userExternalId })),
      body: {},
      flash: sinon.spy(),
      session: {
        pageData: {
          twoFactorAuthMethod
        }
      }
    }
    res = {
      redirect: sinon.spy()
    }
    next = sinon.spy()
    configureNewOtpKeySpy.resetHistory()
  })

  describe('No code is entered', () => {
    it('should redirect to the GET route with errors in the session', async () => {
      req.body.code = ''

      await controllerWithAdminusersSuccess(req, res, next)

      sinon.assert.calledWith(res.redirect, paths.user.profile.twoFactorAuth.configure)
      expect(req.session.pageData).to.have.property('configureTwoFactorAuthMethodRecovered')
      expect(req.session.pageData.configureTwoFactorAuthMethodRecovered).to.deep.equal({
        errors: {
          securityCode: 'Enter your security code'
        }
      })
    })
  })

  describe('A valid code is entered', () => {
    const validCode = '123 456'
    const expectedSanitisedCode = '123456'

    beforeEach(() => {
      req.body.code = validCode
    })

    describe('Success response from adminusers', () => {
      it('should call adminusers to configure OTP key and redirect to profile', async () => {
        await controllerWithAdminusersSuccess(req, res, next)

        sinon.assert.calledWith(configureNewOtpKeySpy, userExternalId, expectedSanitisedCode, twoFactorAuthMethod)
        sinon.assert.calledWith(req.flash, 'otpMethodUpdated', twoFactorAuthMethod)
        sinon.assert.calledWith(res.redirect, paths.user.profile.index)
      })
    })

    describe('Adminusers returns a 400 response', () => {
      it('should call redirect with errors in session', async () => {
        const error = new RESTClientError('An error', 'adminusers', 400)
        const adminusersRejectsStub = () => Promise.reject(error)

        const controllerWithAdminusersError = getController(adminusersRejectsStub)
        await controllerWithAdminusersError(req, res, next)

        sinon.assert.calledWith(res.redirect, paths.user.profile.twoFactorAuth.configure)
        expect(req.session.pageData).to.have.property('configureTwoFactorAuthMethodRecovered')
        expect(req.session.pageData.configureTwoFactorAuthMethodRecovered).to.deep.equal({
          errors: {
            securityCode: 'The security code you’ve used is incorrect or has expired'
          }
        })
      })
    })

    describe('Adminusers returns a 401 response', () => {
      it('should call redirect with errors in session for SMS method', async () => {
        const error = new RESTClientError('An error', 'adminusers', 401)
        const adminusersRejectsStub = () => Promise.reject(error)

        const controllerWithAdminusersError = getController(adminusersRejectsStub)
        await controllerWithAdminusersError(req, res, next)

        sinon.assert.calledWith(res.redirect, paths.user.profile.twoFactorAuth.configure)
        expect(req.session.pageData).to.have.property('configureTwoFactorAuthMethodRecovered')
        expect(req.session.pageData.configureTwoFactorAuthMethodRecovered).to.deep.equal({
          errors: {
            securityCode: 'The security code you’ve used is incorrect or has expired'
          }
        })
      })

      it('should call redirect with errors in session for APP method', async () => {
        req.session.pageData.twoFactorAuthMethod = secondFactorMethod.APP

        const error = new RESTClientError('An error', 'adminusers', 401)
        const adminusersRejectsStub = () => Promise.reject(error)

        const controllerWithAdminusersError = getController(adminusersRejectsStub)
        await controllerWithAdminusersError(req, res, next)

        sinon.assert.calledWith(res.redirect, paths.user.profile.twoFactorAuth.configure)
        expect(req.session.pageData).to.have.property('configureTwoFactorAuthMethodRecovered')
        expect(req.session.pageData.configureTwoFactorAuthMethodRecovered).to.deep.equal({
          errors: {
            securityCode: 'The security code you entered is not correct, try entering it again or wait for your authenticator app to give you a new code'
          }
        })
      })
    })

    describe('Adminusers returns an unhandled error status code', () => {
      it('should call next with the error', async () => {
        const error = new RESTClientError('An error', 'adminusers', 500)
        const adminusersRejectsStub = () => Promise.reject(error)

        const controllerWithAdminusersError = getController(adminusersRejectsStub)
        await controllerWithAdminusersError(req, res, next)

        sinon.assert.calledWith(next, error)
      })
    })
  })
})

function getController (configureNewOtpKeySpy) {
  return proxyquire('./post-configure.controller', {
    '../../../services/user.service.js': {
      configureNewOtpKey: configureNewOtpKeySpy
    }
  })
}
