require('@test/test-helpers/serialize-mock.js')
const request = require('supertest')
const { getAppWithLoggedInUser, getUser, getAppWithSessionWithoutSecondFactor, getAppWithLoggedOutSession } = require('@test/test-helpers/mock-session.js')
const paths = require('@root/paths.js')
const server = require('../../server.js')

let app

describe('An endpoint not protected', () => {
  afterEach(() => {
    app = null
  })

  it('allows access if not authenticated', done => {
    app = getAppWithLoggedOutSession(server.getApp(), {})
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
      .expect('Location', paths.index)
      .end(done)
  })

  it('shows noaccess error page if user disabled', done => {
    const user = getUser()
    user.disabled = true
    app = getAppWithLoggedInUser(server.getApp(), user)
    request(app)
      .get(paths.index)
      .expect(401)
      .end(done)
  })
})

describe('An endpoint protected by is-user-authorised middleware', function () {
  afterEach(function () {
    app = null
  })

  it('redirects to /login if not authenticated', done => {
    app = getAppWithLoggedOutSession(server.getApp(), {})
    request(app)
      .get(paths.index)
      .expect(302)
      .expect('Location', paths.user.logIn)
      .end(done)
  })

  it('allows access if authenticated (redirects to dashboard)', done => {
    const user = getUser()
    app = getAppWithLoggedInUser(server.getApp(), user)
    request(app)
      .get(paths.user.logIn)
      .expect(302)
      .expect('Location', paths.index)
      .end(done)
  })

  it('redirects if not second factor loggedin', done => {
    const user = getUser()

    app = getAppWithSessionWithoutSecondFactor(server.getApp(), user)
    request(app)
      .get(paths.index)
      .expect(302)
      .expect('Location', paths.user.logIn)
      .end(done)
  })
})
