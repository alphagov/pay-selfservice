var path = require('path')
require(path.join(__dirname, '/../test_helpers/serialize_mock.js'))
var request = require('supertest')
var getApp = require(path.join(__dirname, '/../../server.js')).getApp
var nock = require('nock')
var assert = require('assert')
var notp = require('notp')
var chai = require('chai')
var _ = require('lodash')
var userFixtures = require('../fixtures/user_fixtures')
var sinon = require('sinon')

var paths = require(path.join(__dirname, '/../../app/paths.js'))
var mockSession = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
var loginController = require(path.join(__dirname, '/../../app/controllers/login'))
var mockRes = require('../fixtures/response')
const {CONNECTOR_URL} = process.env

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect

var adminusersMock = nock(process.env.ADMINUSERS_URL)
var ACCOUNT_ID = 182364
const USER_RESOURCE = '/v1/api/users'
const CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts'

var user = mockSession.getUser()
user.serviceRoles[0].service.gatewayAccountIds = [ACCOUNT_ID]
function testController (controller, req, res) {
  _.assign(req, {
    headers: {'x-request-id': 'some-unique-id'},
    flash: sinon.stub()
  })
  controller(req, res)
};

describe('The logged in endpoint', function () {
  it('should render ok when logged in', function (done) {
    var app = mockSession.getAppWithLoggedInUser(getApp(), user)

    nock(CONNECTOR_URL)
      .get(`/v1/api/accounts/${ACCOUNT_ID}/transactions-summary`)
      .query(() => true)
      .reply(200, {})

    request(app)
      .get('/')
      .expect(200)
      .expect(function (res) {
        assert(res.text.indexOf('Dashboard') !== -1)
      })
      .end(done)
  })

  it('should redirecect to login if not logged in', function (done) {
    var app = mockSession.getAppWithSessionAndGatewayAccountCookies(getApp(), {})
    request(app)
      .get('/')
      .expect(302)
      .expect('Location', '/login')
      .end(done)
  })

  it('should redirecect to otp login if no otp', function (done) {
    var app = mockSession.getAppWithSessionWithoutSecondFactor(getApp(), mockSession.getUser({gateway_account_ids: [ACCOUNT_ID]}))
    request(app)
      .get('/')
      .expect(302)
      .expect('Location', '/otp-login')
      .end(done)
  })
})

describe('The logout endpoint', function () {
  it('should redirect to login', function (done) {
    var app = mockSession.getAppWithSessionAndGatewayAccountCookies(getApp(), {})
    request(app)
      .get('/logout')
      .expect(302)
      .expect('Location', '/login')
      .end(done)
  })

  it('should handle case where mockSession expired', (done) => {
    request(getApp())
      .get('/logout')
      .expect(302)
      .expect('Location', '/login')
      .end(done)
  })
})

describe('The postlogin endpoint', function () {
  it('should redirect to root and clean mockSession of all but passport,currentGatewayAccountId  and last_url', function (done) {
    // happens after the passort middleware, so cant test through supertest
    const user = mockSession.getUser()
    const session = mockSession.getMockSession(user)
    const expectedUrl = paths.user.otpLogIn
    const req = {
      session: _.merge(session, {currentGatewayAccountId: '13'}),
      headers: {'x-request-id': 'some-unique-id'},
      user: user
    }
    const res = mockRes.getStubbedRes()

    loginController.postLogin(req, res)
    expect(res.redirect.calledWith(expectedUrl)).to.equal(true)
    expect(req.session).to.deep.equal({
      passport: session.passport,
      last_url: session.last_url,
      currentGatewayAccountId: '13'
    })
    done()
  })
})

describe('The otplogin endpoint', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should render and send key on first time', function (done) {
    var user = mockSession.getUser()

    var sessionData = {
      csrfSecret: '123',
      passport: {
        user: user
      }
    }

    adminusersMock.post(`${USER_RESOURCE}/${user.externalId}/second-factor/`)
      .reply(200)

    var app = mockSession.getAppWithSessionAndGatewayAccountCookies(getApp(), sessionData)
    request(app)
      .get('/otp-login')
      .expect(200)
      .end(function () {
        assert(sessionData.sentCode === true)
        done()
      })
  })

  it('should render and not send key on seccond time', function (done) {
    var user = mockSession.getUser()

    var sessionData = {
      csrfSecret: '123',
      passport: {
        user: user
      },
      sentCode: true
    }

    var app = mockSession.getAppWithSessionAndGatewayAccountCookies(getApp(), sessionData)

    request(app)
      .get('/otp-login')
      .expect(200)
      .end(function () {
        done()
      })
  })
})

describe('The afterOtpLogin endpoint', function () {
  it('should redirect to login to the last url', function (done) {
    var user = mockSession.getUser()
    var session = mockSession.getMockSession(user)
    var req = {
      session: session,
      headers: {'x-request-id': 'some-unique-id'},
      user: user
    }
    var lastUrl = session.last_url
    var res = mockRes.getStubbedRes()

    loginController.afterOTPLogin(req, res)
    expect(res.redirect.calledWith(lastUrl)).to.equal(true)
    done()
  })

  it('should redirect to root if lasturl is not defined', function (done) {
    const user = mockSession.getUser()
    user.sessionVersion = 1
    const req = {
      session: mockSession.getMockSession(user),
      headers: {'x-request-id': 'some-unique-id'},
      user: user
    }
    const res = mockRes.getStubbedRes()
    delete req.session.last_url
    delete req.session.secondFactor
    req.session.version = 0

    loginController.afterOTPLogin(req, res)
    expect(res.redirect.calledWith('/')).to.equal(true)
    expect(req.session.secondFactor).to.equal('totp')
    expect(req.session.version).to.equal(1)
    done()
  })
})

describe('login get endpoint', function () {
  it('should set the right flash message if both fields are empty', function (done) {
    var req = { 'body': { 'username': '', 'password': '' } }
    var res = mockRes.getStubbedRes()

    testController(loginController.loginUser, req, res)
    expect(req.flash('error') === 'empty_all')

    res.locals = { 'flash': {} }
    testController(loginController.loginGet, req, res)
    expect(res.locals.flash === {username: 'You must enter a username', password: 'You must enter a password'})
    done()
  })

  it('should set the right flash message if individual fields are empty', function (done) {
    var req = { 'body': { 'username': '', 'password': '123' } }
    var res = mockRes.getStubbedRes()

    testController(loginController.loginUser, req, res)
    expect(req.flash('error') === 'empty_username')

    res.locals = { 'flash': {} }
    testController(loginController.loginGet, req, res)
    expect(res.locals.flash === {username: 'You must enter a username'})
    done()
  })
})

describe('login post endpoint', function () {
  it('should set the right flash message if both fields are empty', function (done) {
    var req = { 'body': { 'username': '', 'password': '' } }
    var res = mockRes.getStubbedRes()

    testController(loginController.loginUser, req, res)
    expect(req.flash('error') === 'empty_all')
    done()
  })

  it('should set the right flash message if individual fields are empty', function (done) {
    var req = { 'body': { 'username': '', 'password': '123' } }
    var res = mockRes.getStubbedRes()

    testController(loginController.loginUser, req, res)
    expect(req.flash('error') === 'empty_username')
    done()
  })

  it('should display an error if csrf token does not exist for the login post', function (done) {
    request(getApp())
      .post(paths.user.logIn)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({})
      .expect(400, {message: 'There is a problem with the payments platform'})
      .end(done)
  })
})

describe('otp login post enpoint', function () {
  it('should display an error if csrf token does not exist for the login post', function (done) {
    var user = mockSession.getUser()
    var session = mockSession.getMockSession(user)
    delete session.csrfSecret

    var app2 = mockSession.getAppWithSessionAndGatewayAccountCookies(getApp(), session)

    request(app2)
      .post(paths.user.otpLogIn)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({code: notp.totp.gen('12345')})
      .expect(400, {message: 'There is a problem with the payments platform'})
      .end(done)
  })
})

describe('otp send again post enpoint', function () {
  it('should display an error if csrf token does not exist for the send again post', function (done) {
    var user = mockSession.getUser()
    var session = mockSession.getMockSession(user)
    delete session.csrfSecret

    var app2 = mockSession.getAppWithSessionAndGatewayAccountCookies(getApp(), session)

    request(app2)
      .post(paths.user.otpSendAgain)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({})
      .expect(400, {message: 'There is a problem with the payments platform'})
      .end(done)
  })
})

describe('direct login after user registration', function () {
  it('should redirect user to homepage on a successful registration', function (done) {
    let userExternalId = 'an-externalid'
    let userName = 'bob'
    let gatewayAccountId = '2'

    let userResponse = userFixtures.validUserResponse({
      external_id: userExternalId,
      username: userName,
      gateway_account_ids: [gatewayAccountId]}).getPlain()

    adminusersMock.get(`${USER_RESOURCE}/${userExternalId}`)
      .reply(200, userResponse)

    let connectorMock = nock(process.env.CONNECTOR_URL)

    connectorMock.get(`${CONNECTOR_ACCOUNT_PATH}/${gatewayAccountId}`)
      .reply(200, { foo: 'bar', gateway_account_id: gatewayAccountId })

    connectorMock
      .get(`/v1/api/accounts/${gatewayAccountId}/transactions-summary`)
      .query(() => true)
      .reply(200, {})

    let destroyStub = sinon.stub()
    let gatewayAccountData = {
      userExternalId: userExternalId,
      destroy: destroyStub
    }

    let app2 = mockSession.getAppWithRegisterInvitesCookie(getApp(), gatewayAccountData)

    request(app2)
      .get(paths.registerUser.logUserIn)
      .set('Accept', 'application/json')
      .expect(200)
      .expect((res) => {
        expect(res.body.name).to.equal(userName)
        expect(destroyStub.called).to.equal(true)
      })
      .end(done)
  })
})
