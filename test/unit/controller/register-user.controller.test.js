'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')

const userFixtures = require('../../fixtures/user.fixtures')
const inviteFixtures = require('../../fixtures/invite.fixtures')
const paths = require('../../../app/paths')
const User = require('../../../app/models/User.class')
const { RegistrationSessionMissingError, RESTClientError, ExpiredInviteError } = require('../../../app/errors')
const { expect } = require('chai')

describe('Register user controller', () => {
  const email = 'invited-user@example.com'
  const inviteCode = 'a-code'
  const correlationId = 'a-request-id'
  const serviceExternalId = 'a-service-id'

  const verifyOtpSuccessStub = sinon.spy(() => Promise.resolve())
  const completeInviteSuccessStub = sinon.spy(() => Promise.resolve(inviteFixtures.validInviteCompleteResponse({
    service_external_id: serviceExternalId
  })))
  const flashSpy = sinon.spy()

  let validReq, res, next

  beforeEach(() => {
    validReq = {
      register_invite: { code: inviteCode, email },
      user: new User(userFixtures.validUserResponse({ email })),
      correlationId,
      body: {
        'verify-code': 123456
      },
      flash: flashSpy
    }
    res = {
      redirect: sinon.spy(),
      render: sinon.spy(),
      setHeader: sinon.spy(),
      status: sinon.spy()
    }
    next = sinon.spy()
    verifyOtpSuccessStub.resetHistory()
    completeInviteSuccessStub.resetHistory()
    flashSpy.resetHistory()
  })

  describe('Subscribe service', () => {
    function getController (mockCompleteInvite) {
      return proxyquire('../../../app/controllers/register-user.controller', {
        '../services/user-registration.service': {
          completeInvite: mockCompleteInvite
        }
      })
    }

    describe('Valid invite for user', () => {
      it('should accept invite and redirect to "My services', async () => {
        const controller = getController(completeInviteSuccessStub)
        await controller.subscribeService(validReq, res, next)
        sinon.assert.called(completeInviteSuccessStub)
        sinon.assert.calledWith(flashSpy, 'inviteSuccessServiceId', serviceExternalId)
        sinon.assert.calledWith(completeInviteSuccessStub, inviteCode, correlationId)
      })
    })

    describe('Logged in user is not the invited user', () => {
      const req = {
        register_invite: {
          code: 'a-code',
          email: 'invited-user@example.com'
        },
        user: new User(userFixtures.validUserResponse({
          email: 'a-different-user@example.com'
        }))
      }

      it('should redirect to "My services" without accepting invite', async () => {
        const controller = getController(completeInviteSuccessStub)
        await controller.subscribeService(req, res, next)
        sinon.assert.notCalled(completeInviteSuccessStub)
        sinon.assert.calledWith(res.redirect, 303, paths.serviceSwitcher.index)
      })
    })

    describe('Cookie details are missing', () => {
      const req = {
        user: new User(userFixtures.validUserResponse({
          email: 'a-different-user@example.com'
        }))
      }

      it('should call next with error', async () => {
        const controller = getController(completeInviteSuccessStub)
        await controller.subscribeService(req, res, next)
        sinon.assert.notCalled(completeInviteSuccessStub)
        sinon.assert.calledWith(next, sinon.match.instanceOf(RegistrationSessionMissingError))
      })
    })

    describe('Invitation is expired', () => {
      it('should render error page', async () => {
        const completeInviteStub = sinon.stub().throws({ errorCode: 410 })
        const controller = getController(completeInviteStub)
        await controller.subscribeService(validReq, res, next)
        sinon.assert.calledWith(res.status, 410)
        sinon.assert.calledWithMatch(res.render, 'error', { message: 'This invitation is no longer valid' })
      })
    })
  })

  describe('Submit otp verify', () => {
    function getController (verifyOtpSpy, completeInviteSpy) {
      return proxyquire('../../../app/controllers/register-user.controller', {
        '../services/user-registration.service.js': {
          verifyOtp: verifyOtpSpy,
          completeInvite: completeInviteSpy
        }
      })
    }

    describe('Submitted OTP code is correct', () => {
      it('should redirect to logUserIn with a 303', async () => {
        const controllerWithVerifyOtpError = getController(verifyOtpSuccessStub, completeInviteSuccessStub)
        await controllerWithVerifyOtpError.submitOtpVerify(validReq, res, next)

        sinon.assert.calledWith(res.redirect, 303, paths.registerUser.logUserIn)
      })
    })

    describe('Call to verifyOtp returns a 401 response', () => {
      it('should set an error message in the cookie and redirect to registerUser.otpVerify with a 303', async () => {
        const error = new RESTClientError('An error', 'adminusers', 401)
        const verifyOtpFailureStub = () => Promise.reject(error)

        const controllerWithVerifyOtpError = getController(verifyOtpFailureStub, completeInviteSuccessStub)
        await controllerWithVerifyOtpError.submitOtpVerify(validReq, res, next)

        expect(validReq.register_invite).to.have.property('recovered')
        expect(validReq.register_invite.recovered).to.deep.equal({
          errors: {
            verificationCode: 'The verification code you’ve used is incorrect or has expired'
          }
        })
        sinon.assert.calledWith(res.redirect, 303, paths.registerUser.otpVerify)
      })
    })

    describe('Call to verifyOtp returns a 410 response', () => {
      it('should call next with with an ExpiredInviteError', async () => {
        const error = new RESTClientError('An error', 'adminusers', 410)
        const verifyOtpFailureStub = () => Promise.reject(error)

        const controllerWithVerifyOtpError = getController(verifyOtpFailureStub, completeInviteSuccessStub)
        await controllerWithVerifyOtpError.submitOtpVerify(validReq, res, next)

        const expectedError = sinon.match.instanceOf(ExpiredInviteError)
          .and(sinon.match.has('message', `Invite with code ${inviteCode} has expired`))
        sinon.assert.calledWith(next, expectedError)
      })
    })

    describe('Call to verifyOtp returns some other status code', () => {
      it('should call next with the error', async () => {
        const error = new RESTClientError('An error', 'adminusers', 500)
        const verifyOtpFailureStub = () => Promise.reject(error)

        const controllerWithVerifyOtpError = getController(verifyOtpFailureStub, completeInviteSuccessStub)
        await controllerWithVerifyOtpError.submitOtpVerify(validReq, res, next)

        sinon.assert.calledWith(next, error)
      })
    })

    describe('Call to completeInvite returns a 410 response', () => {
      it('should call next with with an ExpiredInviteError', async () => {
        const error = new RESTClientError('An error', 'adminusers', 410)
        const completeInviteFailureStub = () => Promise.reject(error)

        const controllerWithCompleteOtpError = getController(verifyOtpSuccessStub, completeInviteFailureStub)
        await controllerWithCompleteOtpError.submitOtpVerify(validReq, res, next)

        const expectedError = sinon.match.instanceOf(ExpiredInviteError)
          .and(sinon.match.has('message', `Invite with code ${inviteCode} has expired`))
        sinon.assert.calledWith(next, expectedError)
      })
    })

    describe('Call to completeInvite returns some other status code', () => {
      it('should call next with the error', async () => {
        const error = new RESTClientError('An error', 'adminusers', 500)
        const completeInviteFailureStub = () => Promise.reject(error)

        const controllerWithCompleteOtpError = getController(verifyOtpSuccessStub, completeInviteFailureStub)
        await controllerWithCompleteOtpError.submitOtpVerify(validReq, res, next)

        sinon.assert.calledWith(next, error)
      })
    })
  })
})
