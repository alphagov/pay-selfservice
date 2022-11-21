'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const lodash = require('lodash')
const { expect } = require('chai')
const paths = require('../paths.js')

const gatewayAccountFixtures = require('../../test/fixtures/gateway-account.fixtures')

const gatewayAccountExternalId = 'an-external-id'

describe('Register service', function () {
  let req, res, next, updateServiceNameSpy

  beforeEach(() => {
    req = {
      flash: sinon.spy()
    }

    res = {
      setHeader: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy(),
      status: sinon.spy()
    }
    next = sinon.spy()
    updateServiceNameSpy = sinon.spy()
  })

  function getControllerWithStubs () {
    return proxyquire('./register-service.controller.js', {
      '../services/service-registration.service': {
        submitRegistration: () => Promise.resolve()
      },
      '../services/service.service': {
        updateServiceName: updateServiceNameSpy
      },
      '../services/clients/connector.client': {
        ConnectorClient: function () {
          this.getAccount = () => Promise.resolve(gatewayAccountFixtures.validGatewayAccountResponse({
            external_id: gatewayAccountExternalId
          }))
        }
      }
    })
  }

  function getControllerWithStubbedAdminusersError (error) {
    return proxyquire('./register-service.controller.js',
      {
        '../services/service-registration.service': {
          submitRegistration: () => Promise.reject(error)
        }
      })
  }

  describe('Submit registration', () => {
    beforeEach(() => {
      req.body = {
        email: 'foo@example.com',
        'telephone-number': '07512345678',
        password: 'password1234'
      }
    })

    it('should redirect to the registration submitted page when successful', async () => {
      await getControllerWithStubs().submitRegistration(req, res, next)
      sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.confirm)
    })

    it('should redirect with error stating email has to be a public sector email when adminusers responds with a 403', async () => {
      const errorFromAdminusers = {
        errorCode: 403
      }

      await getControllerWithStubbedAdminusersError(errorFromAdminusers).submitRegistration(req, res, next)

      const recovered = lodash.get(req, 'session.pageData.submitRegistration.recovered')
      expect(recovered).to.deep.equal({
        email: req.body.email,
        telephoneNumber: req.body['telephone-number'],
        errors: {
          email: 'Enter a public sector email address'
        }
      })
      sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.register)
    })

    it('should continue to confirmation page when adminusers returns a 409', async () => {
      const errorFromAdminusers = {
        errorCode: 409
      }

      await getControllerWithStubbedAdminusersError(errorFromAdminusers).submitRegistration(req, res, next)
      sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.confirm)
    })

    it('should redirect with error whan an invalid phone number is entered', async () => {
      req.body['telephone-number'] = 'acb1234567' // pragma: allowlist secret

      await getControllerWithStubs().submitRegistration(req, res, next)
      const recovered = lodash.get(req, 'session.pageData.submitRegistration.recovered')
      expect(recovered).to.deep.equal({
        email: req.body.email,
        telephoneNumber: req.body['telephone-number'],
        errors: {
          telephoneNumber: 'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'
        }
      })
      sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.register)
    })

    it('should call next with error for unexpected error from adminusers', async () => {
      const error = {
        errorCode: 404
      }

      await getControllerWithStubbedAdminusersError(error).submitRegistration(req, res, next)
      sinon.assert.calledWith(next, error)
    })
  })

  describe('Submit OTP code', () => {
    const userExternalId = 'a-user-id'
    const submitServiceInviteOtpCodeSpy = sinon.spy(() => Promise.resolve())
    const completeInviteSpy = sinon.spy(() => Promise.resolve(userExternalId))
    const controller = proxyquire('./register-service.controller.js',
      {
        '../services/service-registration.service': {
          completeInvite: completeInviteSpy,
          submitServiceInviteOtpCode: submitServiceInviteOtpCodeSpy
        }
      })

    it('should redirect to route to log user in then show the my service page', async () => {
      const inviteCode = 'a-code'
      const otpCode = '123 456'
      const expectedSanitisedOtpCode = '123456'
      req.body = {
        'verify-code': otpCode
      }
      req.register_invite = {
        code: inviteCode,
        email: 'an-email'
      }
      await controller.submitOtpCode(req, res, next)

      expect(req.register_invite).to.have.property('userExternalId')
      expect(req.register_invite.userExternalId).to.equal(userExternalId)
      sinon.assert.calledWith(submitServiceInviteOtpCodeSpy, inviteCode, expectedSanitisedOtpCode)
      sinon.assert.calledWith(completeInviteSpy, inviteCode)
      sinon.assert.calledWith(res.redirect, 303, paths.registerUser.logUserIn)
    })
  })
})
