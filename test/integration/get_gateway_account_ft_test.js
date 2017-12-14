const nock = require('nock')
const supertest = require('supertest')
const path = require('path')

const session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
const getApp = require(path.join(__dirname, '/../../server.js')).getApp

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect

let app

describe('get account', function () {
  afterEach((done) => {
    nock.cleanAll()
    app = null
    done()
  })

  it('should get account', function (done) {
    const user = session.getUser({
      service_roles: [
        {
          service: {
            external_id: '1234',
            gateway_account_ids: ['1', '2', '5']
          },
          role: {
            permissions: [{name: 'transactions:read'}]
          }
        }
      ]

    })
    const mockSession = session.getMockSession(user)
    session.currentGatewayAccountId = '2'
    app = session.getAppWithSessionAndGatewayAccountCookies(getApp(), mockSession)
    const connectorMock = nock(process.env.CONNECTOR_URL)

    connectorMock.get('/v1/frontend/accounts/1').times(2).reply(200, {
      bob: 'bob',
      type: 'test',
      payment_provider: 'sandbox'
    })

    connectorMock
      .get(`/v1/api/accounts/1/transactions-summary`)
      .query(() => true)
      .reply(200, {})

    supertest(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect(200)
      .expect(data => {
        expect(data.body.currentGatewayAccount).to.deep.equal({
          bob: 'bob',
          type: 'test',
          payment_provider: 'sandbox',
          supports3ds: false,
          full_type: 'sandbox test'
        })
      })
      .end(done)
  })
})
