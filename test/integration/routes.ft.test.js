const request = require('supertest')

const { getApp } = require('../../server')
const session = require('../test-helpers/mock-session.js')

describe('URL redirecting from old ones', () => {
  it('sends user to my services page when using old url', () => {
    const app = session.getAppWithLoggedInUser(getApp(), session.getUser())
    return request(app)
      .get('/transactions')
      .expect(302)
      .then((res) => {
        res.header['location'].should.include('/my-services') // eslint-disable-line
      })
  })

  it('sends user to my services page when using old url', () => {
    const app = session.getAppWithLoggedInUser(getApp(), session.getUser())
    return request(app)
      .get('/dashboard')
      .expect(302)
      .then((res) => {
        res.header['location'].should.include('/my-services') // eslint-disable-line
      })
  })

  it('correctly redirects to login in the account specific paths and without a logged in session', () => {
    const requestSession = {}
    const app = session.getAppWithLoggedOutSession(getApp(), requestSession)
    return request(app)
      .get('/billing-address')
      .expect(302)
      .then((res) => {
        res.header['location'].should.include('/login') // eslint-disable-line
        requestSession.last_url.should.equal('/billing-address') //eslint-disable-line
      })
  })

  it('redirects to My services for an old URL', () => {
    const app = session.getAppWithLoggedInUser(getApp(), session.getUser())
    return request(app)
      .get('/billing-address')
      .expect(302)
      .then((res) => {
        res.header['location'].should.include('/my-services') // eslint-disable-line
      })
  })

  it('correctly 404s as expected for non account specific paths', () => {
    const app = session.getAppWithLoggedInUser(getApp(), session.getUser())
    return request(app)
      .get('/unknown-address')
      .expect(404)
  })
})
