const request = require('supertest')

const { getApp } = require('../../server')
const session = require('../test-helpers/mock-session.js')

describe('URL upgrade utility', () => {
  it('correctly upgrades URLs in the account specific paths', () => {
    const app = session.getAppWithLoggedInUser(getApp(), session.getUser())
    return request(app)
      .get('/billing-address')
      .expect(302)
      .then((res) => {
        res.header['location'].should.include('/account/external-id-set-by-create-app-with-session/billing-address') // eslint-disable-line
      })
  })

  it('correctly upgrades URLs in the account specific paths with complex templated values', () => {
    const app = session.getAppWithLoggedInUser(getApp(), session.getUser())
    return request(app)
      .get('/create-payment-link/manage/some-product-external-id/add-reporting-column/some-metadata-key')
      .expect(302)
      .then((res) => {
        res.header['location'].should.include('/account/external-id-set-by-create-app-with-session/create-payment-link/manage/some-product-external-id/add-reporting-column/some-metadata-key') // eslint-disable-line
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

  it('correctly 404s as expected for non account specific paths', () => {
    const app = session.getAppWithLoggedInUser(getApp(), session.getUser())
    return request(app)
      .get('/unknown-address')
      .expect(404)
  })
})
