const path = require('path')
require(path.join(__dirname, '/../test_helpers/serialize_mock.js'))
const request = require('supertest')
const auth = require(path.join(__dirname, '/../../app/services/auth_service.js'))
const mockSession = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
const getAppWithSessionAndGatewayAccountCookies = mockSession.getAppWithSessionAndGatewayAccountCookies
const getAppWithLoggedInUser = mockSession.getAppWithLoggedInUser
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const server = require(path.join(__dirname, '/../../server.js'))

let app

function addUnprotectedEndpointToApp (app) {
  app.get('/unprotected', function (req, res) {
    res.send('Hello, World!')
  })
}

function addProtectedEndpointToApp (app) {
  app.get('/protected', auth.enforceUserAuthenticated, function (req, res) {
    res.send('Hello, World!')
  })
}

describe('An endpoint not protected', function () {
  afterEach(function () {
    app = null
  })

  it('allows access if not authenticated', function (done) {
    app = getAppWithSessionAndGatewayAccountCookies(server.getApp(), {})
    addUnprotectedEndpointToApp(app)
    request(app)
      .get('/unprotected')
      .expect(200)
      .expect('Hello, World!')
      .end(done)
  })

  it('allows access if authenticated', function (done) {
    const user = mockSession.getUser()
    app = getAppWithLoggedInUser(server.getApp(), user)
    addUnprotectedEndpointToApp(app)
    request(app)
      .get('/unprotected')
      .expect(200)
      .expect('Hello, World!')
      .end(done)
  })

  it('redirects to noaccess if user disabled', function (done) {
    const user = mockSession.getUser()
    user.disabled = true
    app = getAppWithLoggedInUser(server.getApp(), user)
    addProtectedEndpointToApp(app)
    request(app)
      .get('/protected')
      .expect(302)
      .expect('Location', paths.user.noAccess)
      .end(done)
  })
})

describe('An endpoint protected by auth.enforceUserBothFactors', function () {
  afterEach(function () {
    app = null
  })

  it('redirects to /login if not authenticated', function (done) {
    app = getAppWithSessionAndGatewayAccountCookies(server.getApp(), {})
    addProtectedEndpointToApp(app)

    request(app)
      .get('/protected')
      .expect(302)
      .expect('Location', paths.user.logIn)
      .end(done)
  })

  it('allows access if authenticated', function (done) {
    const user = mockSession.getUser()

    app = getAppWithLoggedInUser(server.getApp(), user)
    addProtectedEndpointToApp(app)

    request(app)
      .get('/protected')
      .expect(200)
      .expect('Hello, World!')
      .end(done)
  })

  it('redirects if not second factor loggedin', function (done) {
    const user = mockSession.getUser()

    app = mockSession.getAppWithSessionWithoutSecondFactor(server.getApp(), user)
    addProtectedEndpointToApp(app)

    request(app)
      .get('/protected')
      .expect(302)
      .expect('Location', paths.user.otpLogIn)
      .end(done)
  })
})
