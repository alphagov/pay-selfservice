'use strict'

const nock = require('nock')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const reqFixtures = require('../fixtures/browser/forgotten-password.fixtures')
const resFixtures = require('../fixtures/response')
const userFixtures = require('../fixtures/user.fixtures')

const alwaysValidPassword = function (password) {
  return false // common-password returns false if password is not one of the common passwords (which would be invalid)
}

const userService = function (commonPasswordMock) {
  return proxyquire('../../app/services/user.service.js', {
    'common-password': commonPasswordMock || alwaysValidPassword
  })
}

const forgottenPassword = function (commonPasswordMock) {
  return proxyquire('../../app/controllers/forgotten-password.controller.js', {
    '../services/user.service.js': userService(commonPasswordMock)
  })
}

const adminusersMock = nock(process.env.ADMINUSERS_URL)

const USER_RESOURCE = '/v1/api/users'
const FORGOTTEN_PASSWORD_RESOURCE = '/v1/api/forgotten-passwords'
const RESET_PASSWORD_RESOURCE = '/v1/api/reset-password'

describe('forgotten_password_controller', function () {
  const forgottenPasswordController = forgottenPassword()

  afterEach(() => {
    nock.cleanAll()
  })

  it('send email upon valid forgotten password reset request', async () => {
    const req = reqFixtures.validForgottenPasswordPost()
    const res = resFixtures.getStubbedRes()
    const username = req.body.username

    adminusersMock.post(FORGOTTEN_PASSWORD_RESOURCE, userFixtures
      .validForgottenPasswordCreateRequest(username))
      .reply(200)

    await forgottenPasswordController.emailPost(req, res)
    sinon.assert.calledWith(res.redirect, '/reset-password-requested')
  })

  it('send render the page with errors if no email is entered', async () => {
    const req = reqFixtures.validForgottenPasswordPost()
    const res = resFixtures.getStubbedRes()
    req.body.username = ''

    await forgottenPasswordController.emailPost(req, res)
    sinon.assert.calledWithMatch(res.render, 'forgotten-password/index', {
      username: '',
      errors: {
        username: 'Enter an email address'
      }
    })
  })

  it('show the password reset email sent page if account is not found in adminusers', async () => {
    const req = reqFixtures.validForgottenPasswordPost()
    const res = resFixtures.getStubbedRes()
    const username = req.body.username

    adminusersMock.post(FORGOTTEN_PASSWORD_RESOURCE, userFixtures
      .validForgottenPasswordCreateRequest(username))
      .reply(404)

    await forgottenPasswordController.emailPost(req, res)
    sinon.assert.calledWith(res.redirect, '/reset-password-requested')
  })

  it('should show the same page with a generic error when we get an unexpected error from adminusers', async () => {
    const req = reqFixtures.validForgottenPasswordPost()
    const res = resFixtures.getStubbedRes()
    const username = req.body.username

    adminusersMock.post(FORGOTTEN_PASSWORD_RESOURCE, userFixtures
      .validForgottenPasswordCreateRequest(username))
      .reply(500)

    await forgottenPasswordController.emailPost(req, res)
    sinon.assert.calledWith(req.flash, 'genericError', 'Something went wrong. Please try again.')
    sinon.assert.calledWith(res.redirect, '/reset-password')
  })

  it('display new password capture form', async () => {
    const req = reqFixtures.validForgottenPasswordGet()
    const res = resFixtures.getStubbedRes()
    const token = req.params.id

    const forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ code: token })

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse)

    await forgottenPasswordController.newPasswordGet(req, res)
    sinon.assert.calledWith(res.render, 'forgotten-password/new-password', { id: token })
  })

  it('display error view if token not found/expired', async () => {
    const req = reqFixtures.validForgottenPasswordGet()
    const res = resFixtures.getStubbedRes()
    const token = req.params.id

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(404)

    await forgottenPasswordController.newPasswordGet(req, res)
    sinon.assert.calledWith(req.flash, 'genericError', 'The password reset request has expired or is invalid. Please try again.')
    sinon.assert.calledWith(res.redirect, '/login')
  })

  it('reset users password upon valid reset password request', async () => {
    const req = reqFixtures.validUpdatePasswordPost()
    const res = resFixtures.getStubbedRes()
    const userExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const token = req.params.id
    const forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ userExternalId, code: token })
    const userResponse = userFixtures.validUserResponse({ external_id: userExternalId })

    adminusersMock.get(`${USER_RESOURCE}/${userExternalId}`)
      .reply(200, userResponse)

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse)

    adminusersMock.post(RESET_PASSWORD_RESOURCE, userFixtures
      .validUpdatePasswordRequest(token, req.body.password))
      .reply(204)

    adminusersMock.patch(`${USER_RESOURCE}/${userExternalId}`, userFixtures
      .validIncrementSessionVersionRequest())
      .reply(200)

    await forgottenPasswordController.newPasswordPost(req, res)
    sinon.assert.called(req.session.destroy)
    sinon.assert.calledWith(req.flash, 'generic', 'Password has been updated')
    sinon.assert.calledWith(res.redirect, '/login')
  })

  it('reset users password upon valid reset password request should destroy session even if incrementing user session fails', async () => {
    const req = reqFixtures.validUpdatePasswordPost()
    const res = resFixtures.getStubbedRes()
    const userExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const token = req.params.id
    const forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ userExternalId, code: token })
    const userResponse = userFixtures.validUserResponse({ external_id: userExternalId })

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse)

    adminusersMock.get(`${USER_RESOURCE}/${userExternalId}`)
      .reply(200, userResponse)

    adminusersMock.post(RESET_PASSWORD_RESOURCE, userFixtures
      .validUpdatePasswordRequest(token, req.body.password))
      .reply(204)

    adminusersMock.patch(`${USER_RESOURCE}/${userExternalId}`, userFixtures
      .validIncrementSessionVersionRequest())
      .reply(500)

    await forgottenPasswordController.newPasswordPost(req, res)
    sinon.assert.called(req.session.destroy)
    sinon.assert.calledWith(req.flash, 'generic', 'Password has been updated')
    sinon.assert.calledWith(res.redirect, '/login')
  })

  it('should render page with errors if password is invalid', async () => {
    const req = reqFixtures.validUpdatePasswordPost()
    const res = resFixtures.getStubbedRes()
    const username = req.body.username
    const userExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    req.body.password = 'short'
    const userResponse = userFixtures.validUserResponse({ username, external_id: userExternalId })
    const token = req.params.id
    const forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ userExternalId, code: token })

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse)

    adminusersMock.get(`${USER_RESOURCE}/${userExternalId}`)
      .reply(200, userResponse)

    await forgottenPasswordController.newPasswordPost(req, res)
    sinon.assert.calledWithMatch(res.render, 'forgotten-password/new-password', {
      id: token,
      errors: {
        password: 'Password must be 10 characters or more'
      }
    })
  })

  it('error if unknown error returns from adminusers', async () => {
    const req = reqFixtures.validUpdatePasswordPost()
    const res = resFixtures.getStubbedRes()
    const username = req.body.username
    const userExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const userResponse = userFixtures.validUserResponse({ username, external_id: userExternalId })
    const token = req.params.id
    const forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ userExternalId, code: token })

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse)

    adminusersMock.get(`${USER_RESOURCE}/${userExternalId}`)
      .reply(200, userResponse)

    adminusersMock.post(RESET_PASSWORD_RESOURCE, userFixtures
      .validUpdatePasswordRequest(token, req.body.password))
      .reply(500)

    await forgottenPasswordController.newPasswordPost(req, res)
    sinon.assert.calledWith(req.flash, 'genericError', 'There has been a problem updating password. Please try again.')
    sinon.assert.calledWith(res.redirect, `/reset-password/${token}`)
  })
})
