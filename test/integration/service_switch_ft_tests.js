const path = require('path')
const nock = require('nock')
const supertest = require('supertest')
const csrf = require('csrf')

const session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
const getApp = require(path.join(__dirname, '/../../server.js')).getApp

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect

let app

describe('service switch controller', function () {
  afterEach((done) => {
    nock.cleanAll()
    app = null
    done()
  })

  it('should post request for new account id', function (done) {
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
        expect(mockGatewayAccountCookie.currentGatewayAccountId).to.equal('5')
      })
      .end(done)
  })
})
