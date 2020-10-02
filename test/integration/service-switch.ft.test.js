const path = require('path')
const nock = require('nock')
const supertest = require('supertest')
const csrf = require('csrf')

const session = require(path.join(__dirname, '/../test-helpers/mock-session.js'))
const getApp = require(path.join(__dirname, '/../../server.js')).getApp

let app

describe('service switch controller', () => {
  afterEach((done) => {
    nock.cleanAll()
    app = null
    done()
  })

  it('should post request for new account id', done => {
    let user = session.getUser({
      gateway_account_ids: ['1', '2', '5']
    })
    let mockGatewayAccountCookie = {
      currentGatewayAccountId: 1
    }
    let mockSession = session.getMockSession(user)
    app = session.getAppWithSessionAndGatewayAccountCookies(getApp(), mockSession, mockGatewayAccountCookie)

    supertest(app)
      .post('/my-services/switch')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('x-request-id', 'bob')
      .send({
        gatewayAccountId: '5',
        csrfToken: csrf().create('123')
      })
      .expect(302)
      .expect(() => {
        expect(mockGatewayAccountCookie.currentGatewayAccountId).toBe('5')
      })
      .end(done)
  })
})
