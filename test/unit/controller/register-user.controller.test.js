'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')

const userFixtures = require('../../fixtures/user.fixtures')
const inviteFixtures = require('../../fixtures/invite.fixtures')
const paths = require('../../../app/paths')
const routes = require('../routes')
const User = require('../../../app/models/User.class')
const { RegistrationSessionMissingError } = require('../../../app/errors')

describe('Register user controller', () => {
  const email = 'invited-user@example.com'
  const code = 'a-code'
  const correlationId = 'a-request-id'
  const serviceExternalId = 'a-service-id'

  const completeInviteSuccessStub = sinon.stub().returns(inviteFixtures.validInviteCompleteResponse({
    service_external_id: serviceExternalId
  }))
  const flashSpy = sinon.spy()
  const validReq = {
    register_invite: { code, email },
    user: new User(userFixtures.validUserResponse({ email })),
    correlationId,
    flash: flashSpy
  }

  let res, next

  function getController (mockCompleteInvite) {
    return proxyquire('../../../app/controllers/register-user.controller', {
      '../services/user-registration.service': {
        completeInvite: mockCompleteInvite
      }
    })
  }

  describe('Subscribe service', () => {
    beforeEach(() => {
      res = {
        redirect: sinon.spy(),
        render: sinon.spy(),
        setHeader: sinon.spy(),
        status: sinon.spy()
      }
      next = sinon.spy()
      completeInviteSuccessStub.resetHistory()
      flashSpy.resetHistory()
    })

    describe('Valid invite for user', () => {
      it('should accept invite and redirect to "My services', async () => {
        const controller = getController(completeInviteSuccessStub)
        await controller.subscribeService(validReq, res, next)
        sinon.assert.called(completeInviteSuccessStub)
        sinon.assert.calledWith(flashSpy, 'inviteSuccessServiceId', serviceExternalId)
        sinon.assert.calledWith(completeInviteSuccessStub, code, correlationId)
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
})
