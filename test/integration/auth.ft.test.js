require('../test-helpers/serialize-mock.js')
const request = require('supertest')
const { getAppWithLoggedInUser, getAppWithSessionAndGatewayAccountCookies, getUser, getAppWithSessionWithoutSecondFactor } = require('../test-helpers/mock-session.js')
const paths = require('../../app/paths.js')
const server = require('../../server.js')

let app

describe('An endpoint not protected', () => {
  afterEach(() => {
    app = null
  })

  it('allows access if not authenticated', done => {
    app = getAppWithSessionAndGatewayAccountCookies(server.getApp(), {})
    request(app)
      .get(paths.user.logIn)
      .expect(200)
      .end(done)
  })

  it('allows access if authenticated', done => {
    const user = getUser()
    app = getAppWithLoggedInUser(server.getApp(), user)
    request(app)
      .get(paths.user.logIn)
      .expect(302)
      .expect('Location', paths.serviceSwitcher.index)
      .end(done)
  })

  it('redirects to noaccess if user disabled', done => {
    const user = getUser()
    user.disabled = true
    app = getAppWithLoggedInUser(server.getApp(), user)
    request(app)
      .get(paths.serviceSwitcher.index)
      .expect(302)
      .expect('Location', paths.user.noAccess)
      .end(done)
  })
})

describe('An endpoint protected by auth.enforceUserBothFactors', function () {
  afterEach(function () {
    app = null
  })

  it('redirects to /login if not authenticated', done => {
    app = getAppWithSessionAndGatewayAccountCookies(server.getApp(), {})
    request(app)
      .get(paths.serviceSwitcher.index)
      .expect(302)
      .expect('Location', paths.user.logIn)
      .end(done)
  })

  it('allows access if authenticated (redirects to home page)', done => {
    const user = getUser()
    app = getAppWithLoggedInUser(server.getApp(), user)
    request(app)
      .get(paths.user.logIn)
      .expect(302)
      .expect('Location', paths.serviceSwitcher.index)
      .end(done)
  })

  it('redirects if not second factor loggedin', done => {
    const user = getUser()

    app = getAppWithSessionWithoutSecondFactor(server.getApp(), user)
    request(app)
      .get(paths.serviceSwitcher.index)
      .expect(302)
      .expect('Location', paths.user.otpLogIn)
      .end(done)
  })
})
