const request = require('supertest')

const { getApp } = require('../../server')
const session = require('../test-helpers/mock-session.js')
const app = session.getAppWithLoggedInUser(getApp(), session.getUser())

describe('URL upgrade utility', () => {
  it('correctly upgrades URLs in the account specific paths', () => {
    return request(app)
      .get('/billing-address')
      .expect(302)
      .then((res) => {
        res.header['location'].should.include('/account/external-id-set-by-create-app-with-session/billing-address') // eslint-disable-line
      })
  })

  it('correctly 404s as expected for non account specific paths', () => {
    return request(app)
      .get('/unknown-address')
      .expect(404)
  })
})
