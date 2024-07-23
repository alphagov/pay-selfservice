'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { NotFoundError, ExpiredInviteError } = require('../errors')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')
const paths = require('../paths')
const inviteFixtures = require('../../test/fixtures/invite.fixtures')

describe('Invite validation controller', function () {
  let req, res, next

  const code = 'ndjkadh3182wdoq'

  beforeEach(() => {
    req = {
      params: {
        code
      }
    }

    res = {
      redirect: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should redirect to /register/password if user does not exist', async () => {
    const invite = inviteFixtures.validInviteResponse({ user_exist: false })

    const getValidatedInviteSpy = sinon.spy(() => Promise.resolve(invite))
    const controller = getControllerWithMockedAdminusersClient({
      getValidatedInvite: getValidatedInviteSpy
    })

    await controller.validateInvite(req, res, next)

    sinon.assert.calledWith(getValidatedInviteSpy, code)
    sinon.assert.calledWith(res.redirect, paths.register.password)
    sinon.assert.notCalled(next)
  })

  it('should redirect to /subscribe if user exists and is being invited to join a service', async () => {
    const invite = inviteFixtures.validInviteResponse({
      user_exist: true,
      is_invite_to_join_service: true
    })

    const getValidatedInviteSpy = sinon.spy(() => Promise.resolve(invite))
    const controller = getControllerWithMockedAdminusersClient({
      getValidatedInvite: getValidatedInviteSpy
    })

    await controller.validateInvite(req, res, next)

    sinon.assert.calledWith(getValidatedInviteSpy, code)
    sinon.assert.calledWith(res.redirect, paths.invite.subscribeService)
    sinon.assert.notCalled(next)
  })

  it('should redirect to /my-services if user exists and the invite is for self-registration', async () => {
    const invite = inviteFixtures.validInviteResponse({
      user_exist: true,
      is_invite_to_join_service: false
    })

    const getValidatedInviteSpy = sinon.spy(() => Promise.resolve(invite))
    const controller = getControllerWithMockedAdminusersClient({
      getValidatedInvite: getValidatedInviteSpy
    })

    await controller.validateInvite(req, res, next)

    sinon.assert.calledWith(getValidatedInviteSpy, code)
    sinon.assert.calledWith(res.redirect, paths.serviceSwitcher.index)
    sinon.assert.notCalled(next)
  })

  it('should handle 404 as unable to process registration at this time', async () => {
    const error = new RESTClientError('Error', 'adminusers', 404)
    const getValidatedInviteSpy = sinon.spy(() => Promise.reject(error))
    const controller = getControllerWithMockedAdminusersClient({
      getValidatedInvite: getValidatedInviteSpy
    })

    await controller.validateInvite(req, res, next)

    sinon.assert.calledWith(getValidatedInviteSpy, code)
    sinon.assert.calledWith(next, sinon.match.instanceOf(NotFoundError)
      .and(sinon.match.has('message', `Attempted to follow an invite link for invite code ${code}, which was not found`)))
    sinon.assert.notCalled(res.redirect)
  })

  it('should handle 410 as this invitation link has expired', async () => {
    const error = new RESTClientError('Error', 'adminusers', 410)
    const getValidatedInviteSpy = sinon.spy(() => Promise.reject(error))
    const controller = getControllerWithMockedAdminusersClient({
      getValidatedInvite: getValidatedInviteSpy
    })

    await controller.validateInvite(req, res, next)

    sinon.assert.calledWith(getValidatedInviteSpy, code)
    sinon.assert.calledWith(next, sinon.match.instanceOf(ExpiredInviteError)
      .and(sinon.match.has('message', `Invite with code ${code} has expired`)))
    sinon.assert.notCalled(res.redirect)
  })

  it('should handle unexpected error by calling next', async () => {
    const error = new RESTClientError('Error', 'adminusers', undefined)
    const getValidatedInviteSpy = sinon.spy(() => Promise.reject(error))
    const controller = getControllerWithMockedAdminusersClient({
      getValidatedInvite: getValidatedInviteSpy
    })

    await controller.validateInvite(req, res, next)

    sinon.assert.calledWith(getValidatedInviteSpy, code)
    sinon.assert.notCalled(res.redirect)
    sinon.assert.calledWith(next, error)
  })
})

function getControllerWithMockedAdminusersClient (mockedAdminusersClient) {
  return proxyquire('./invite-validation.controller.js', {
    '../services/clients/adminusers.client': () => mockedAdminusersClient
  })
}
