'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')

const userFixtures = require('../../test/fixtures/user.fixtures')
const inviteFixtures = require('../../test/fixtures/invite.fixtures')
const paths = require('../paths')
const User = require('../models/User.class')
const { RegistrationSessionMissingError } = require('../errors')

describe('Subscribe service controller', () => {
  const email = 'invited-user@example.com'
  const inviteCode = 'a-code'
  const serviceExternalId = 'a-service-id'
  const otpCode = '123 456'

  const verifyOtpSuccessStub = sinon.spy(() => Promise.resolve())
  const completeInviteSuccessStub = sinon.spy(() => Promise.resolve(inviteFixtures.validInviteCompleteResponse({
    service_external_id: serviceExternalId
  })))
  const flashSpy = sinon.spy()

  let req, res, next

  beforeEach(() => {
    req = {
      register_invite: { code: inviteCode, email },
      user: new User(userFixtures.validUserResponse({ email })),
      body: {
        'verify-code': otpCode
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
      return proxyquire('./subscribe-service.controller', {
        '../services/clients/adminusers.client': () => ({
          completeInvite: mockCompleteInvite
        })
      })
    }

    describe('Valid invite for user', () => {
      it('should accept invite and redirect to "My services', async () => {
        const controller = getController(completeInviteSuccessStub)
        await controller.subscribeService(req, res, next)
        sinon.assert.calledWith(completeInviteSuccessStub, inviteCode, 'SMS')
        sinon.assert.calledWith(flashSpy, 'inviteSuccessServiceId', serviceExternalId)
        sinon.assert.calledWith(completeInviteSuccessStub, inviteCode)
      })
    })

    describe('The email on the user and invite are the same but with different case', () => {
      it('should accept invite and redirect to "My services', async () => {
        req.register_invite.email = 'Invited-User@example.com'

        const controller = getController(completeInviteSuccessStub)
        await controller.subscribeService(req, res, next)
        sinon.assert.called(completeInviteSuccessStub)
        sinon.assert.calledWith(flashSpy, 'inviteSuccessServiceId', serviceExternalId)
        sinon.assert.calledWith(completeInviteSuccessStub, inviteCode)
      })
    })

    describe('Logged in user is not the invited user', () => {
      it('should redirect to "My services" without accepting invite', async () => {
        req.register_invite.email = 'a-different-user@example.com'

        const controller = getController(completeInviteSuccessStub)
        await controller.subscribeService(req, res, next)
        sinon.assert.notCalled(completeInviteSuccessStub)
        sinon.assert.calledWith(res.redirect, 303, paths.serviceSwitcher.index)
      })
    })

    describe('Cookie details are missing', () => {
      it('should call next with error', async () => {
        delete req.register_invite

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
        await controller.subscribeService(req, res, next)
        sinon.assert.calledWith(res.status, 410)
        sinon.assert.calledWithMatch(res.render, 'error', { message: 'This invitation is no longer valid' })
      })
    })
  })
})
