const path = require('path')
const nock = require('nock')
const proxyquire = require('proxyquire')
const reqFixtures = require(path.join(__dirname, '/../fixtures/browser/forgotten-password.fixtures'))
const resFixtures = require(path.join(__dirname, '/../fixtures/response'))
const userFixtures = require(path.join(__dirname, '/../fixtures/user.fixtures'))

let chai = require('chai')
let chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

const expect = chai.expect

let alwaysValidPassword = function (password) {
  return false // common-password returns false if password is not one of the common passwords (which would be invalid)
}

let userService = function (commonPasswordMock) {
  return proxyquire(path.join(__dirname, '/../../app/services/user.service.js'), {
    'common-password': commonPasswordMock || alwaysValidPassword
  })
}

let forgottenPassword = function (commonPasswordMock) {
  return proxyquire(path.join(__dirname, '/../../app/controllers/forgotten-password.controller.js'), {
    '../services/user.service.js': userService(commonPasswordMock)
  })
}

let adminusersMock = nock(process.env.ADMINUSERS_URL)

const USER_RESOURCE = '/v1/api/users'
const FORGOTTEN_PASSWORD_RESOURCE = '/v1/api/forgotten-passwords'
const RESET_PASSWORD_RESOURCE = '/v1/api/reset-password'

describe('forgotten_password_controller', function () {
  let forgottenPasswordController = forgottenPassword()

  afterEach((done) => {
    nock.cleanAll()
    done()
  })

  it('send email upon valid forgotten password reset request', function (done) {
    let req = reqFixtures.validForgottenPasswordPost()
    let res = resFixtures.getStubbedRes()
    let username = req.body.username

    adminusersMock.post(FORGOTTEN_PASSWORD_RESOURCE, userFixtures
      .validForgottenPasswordCreateRequest(username)
      .getPlain())
      .reply(200)

    forgottenPasswordController.emailPost(req, res).should.be.fulfilled
      .then(() => {
        expect(res.redirect.called).to.equal(true)
      }).should.notify(done)
  })

  it('display new password capture form', function (done) {
    let req = reqFixtures.validForgottenPasswordGet()
    let res = resFixtures.getStubbedRes()
    let token = req.params.id

    let forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ code: token })

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse.getPlain())

    forgottenPasswordController.newPasswordGet(req, res).should.be.fulfilled
      .then(() => {
        expect(res.render.calledWith('forgotten-password/new-password', { id: token })).to.equal(true)
      }).should.notify(done)
  })

  it('display error view if token not found/expired', function (done) {
    let req = reqFixtures.validForgottenPasswordGet()
    let res = resFixtures.getStubbedRes()
    let token = req.params.id

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(404)

    forgottenPasswordController.newPasswordGet(req, res).should.be.fulfilled
      .then(() => {
        expect(req.flash.calledWith('genericError', 'Invalid password reset link')).to.equal(true)
        expect(res.redirect.calledWith('/login')).to.equal(true)
      }).should.notify(done)
  })

  it('reset users password upon valid reset password request', function (done) {
    let req = reqFixtures.validUpdatePasswordPost()
    let res = resFixtures.getStubbedRes()
    let userExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    let token = req.params.id
    let forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ userExternalId: userExternalId, code: token })
    let userResponse = userFixtures.validUserResponse({ external_id: userExternalId })

    adminusersMock.get(`${USER_RESOURCE}/${userExternalId}`)
      .reply(200, userResponse.getPlain())

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse.getPlain())

    adminusersMock.post(RESET_PASSWORD_RESOURCE, userFixtures
      .validUpdatePasswordRequest(token, req.body.password)
      .getPlain())
      .reply(204)

    adminusersMock.patch(`${USER_RESOURCE}/${userExternalId}`, userFixtures
      .validIncrementSessionVersionRequest().getPlain())
      .reply(200)

    forgottenPasswordController.newPasswordPost(req, res).should.be.fulfilled
      .then(() => {
        expect(req.session.destroy.called).to.equal(true)
        expect(req.flash.calledWith('generic', 'Password has been updated')).to.equal(true)
        expect(res.redirect.calledWith('/login')).to.equal(true)
      }).should.notify(done)
  })

  it('reset users password upon valid reset password request should destroy session even if incrementing user session fails', function (done) {
    let req = reqFixtures.validUpdatePasswordPost()
    let res = resFixtures.getStubbedRes()
    let userExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    let token = req.params.id
    let forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ userExternalId: userExternalId, code: token })
    let userResponse = userFixtures.validUserResponse({ external_id: userExternalId })

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse.getPlain())

    adminusersMock.get(`${USER_RESOURCE}/${userExternalId}`)
      .reply(200, userResponse.getPlain())

    adminusersMock.post(RESET_PASSWORD_RESOURCE, userFixtures
      .validUpdatePasswordRequest(token, req.body.password)
      .getPlain())
      .reply(204)

    adminusersMock.patch(`${USER_RESOURCE}/${userExternalId}`, userFixtures
      .validIncrementSessionVersionRequest()
      .getPlain())
      .reply(500)

    forgottenPasswordController.newPasswordPost(req, res).should.be.fulfilled
      .then(() => {
        expect(req.session.destroy.called).to.equal(true)
        expect(req.flash.calledWith('generic', 'Password has been updated')).to.equal(true)
        expect(res.redirect.calledWith('/login')).to.equal(true)
      }).should.notify(done)
  })

  it('error if password is too short', function (done) {
    let req = reqFixtures.validUpdatePasswordPost()
    let res = resFixtures.getStubbedRes()
    let username = req.body.username
    let userExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    req.body.password = 'short'
    let userResponse = userFixtures.validUserResponse({ username: username, external_id: userExternalId })
    let token = req.params.id
    let forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ userExternalId: userExternalId, code: token })

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse.getPlain())

    adminusersMock.get(`${USER_RESOURCE}/${userExternalId}`)
      .reply(200, userResponse.getPlain())

    forgottenPasswordController.newPasswordPost(req, res).should.be.fulfilled
      .then(() => {
        expect(req.flash.calledWith('genericError', 'Your password must be at least 10 characters.')).to.equal(true)
        expect(res.redirect.calledWith('/reset-password/' + token)).to.equal(true)
      }).should.notify(done)
  })

  it('error if password is one of the common passwords', function (done) {
    let aForgottenPasswordController = forgottenPassword(() => true)
    let req = reqFixtures.validUpdatePasswordPost()
    let res = resFixtures.getStubbedRes()
    let username = req.body.username
    let userExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    req.body.password = 'common password'
    let userResponse = userFixtures.validUserResponse({ username: username, external_id: userExternalId })
    let token = req.params.id
    let forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ userExternalId: userExternalId, code: token })

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse.getPlain())

    adminusersMock.get(`${USER_RESOURCE}/${userExternalId}`)
      .reply(200, userResponse.getPlain())

    aForgottenPasswordController.newPasswordPost(req, res).should.be.fulfilled
      .then(() => {
        expect(req.flash.calledWith('genericError', 'The password you tried to create contains a common phrase or combination of characters. Choose something that’s harder to guess.')).to.equal(true)
        expect(res.redirect.calledWith('/reset-password/' + token)).to.equal(true)
      }).should.notify(done)
  })

  it('error if unknown error returns from adminusers', function (done) {
    let req = reqFixtures.validUpdatePasswordPost()
    let res = resFixtures.getStubbedRes()
    let username = req.body.username
    let userExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    let userResponse = userFixtures.validUserResponse({ username: username, external_id: userExternalId })
    let token = req.params.id
    let forgottenPasswordResponse = userFixtures.validForgottenPasswordResponse({ userExternalId: userExternalId, code: token })

    adminusersMock.get(`${FORGOTTEN_PASSWORD_RESOURCE}/${token}`)
      .reply(200, forgottenPasswordResponse.getPlain())

    adminusersMock.get(`${USER_RESOURCE}/${userExternalId}`)
      .reply(200, userResponse.getPlain())

    adminusersMock.post(RESET_PASSWORD_RESOURCE, userFixtures
      .validUpdatePasswordRequest(token, req.body.password)
      .getPlain())
      .reply(500)

    forgottenPasswordController.newPasswordPost(req, res).should.be.fulfilled
      .then(() => {
        expect(req.flash.calledWith('genericError', 'There has been a problem updating password.')).to.equal(true)
        expect(res.redirect.calledWith('/reset-password/' + token)).to.equal(true)
      }).should.notify(done)
  })
})
