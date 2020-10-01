const nock = require('nock')
const supertest = require('supertest')
const path = require('path')

const session = require(path.join(__dirname, '/../test-helpers/mock-session.js'))
const getApp = require(path.join(__dirname, '/../../server.js')).getApp

const { expect } = require('chai')

let app

describe('get account', function () {
  afterEach((done) => {
    nock.cleanAll()
    app = null
    done()
  })

  it('should get a card account', function (done) {
    const user = session.getUser({
      service_roles: [
        {
          service: {
            external_id: '1234',
            gateway_account_ids: ['1', '2', '5']
          },
          role: {
            permissions: [{ name: 'transactions:read' }]
          }
        }
      ]

    })
    const mockSession = session.getMockSession(user)
    session.currentGatewayAccountId = '2'
    app = session.getAppWithSessionAndGatewayAccountCookies(getApp(), mockSession)
    const connectorMock = nock(process.env.CONNECTOR_URL)
    const ledgerMock = nock(process.env.LEDGER_URL)
    connectorMock.get('/v1/frontend/accounts/1').times(2).reply(200, {
      bob: 'bob',
      type: 'test',
      payment_provider: 'sandbox'
    })

    ledgerMock
      .get('/v1/report/transactions-summary')
      .query(() => true)
      .reply(200, {
        payments: {
          count: 0,
          gross_amount: 0
        },
        refunds: {
          count: 0,
          gross_amount: 0
        },
        net_income: 0
      })

    supertest(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect(200)
      .expect(data => {
        expect(data.body.currentGatewayAccount).to.deep.equal({
          bob: 'bob',
          disableToggle3ds: false,
          type: 'test',
          payment_provider: 'sandbox',
          supports3ds: false,
          full_type: 'Sandbox test'
        })
      })
      .end(done)
  })

  it('should get a direct debit account', function (done) {
    const user = session.getUser({
      service_roles: [
        {
          service: {
            external_id: '1234',
            gateway_account_ids: ['DIRECT_DEBIT:1owehhserwr', '5']
          },
          role: {
            permissions: [{ name: 'transactions:read' }]
          }
        }
      ]

    })
    const mockSession = session.getMockSession(user)
    session.currentGatewayAccountId = 'DIRECT_DEBIT:1owehhserwr'
    app = session.getAppWithSessionAndGatewayAccountCookies(getApp(), mockSession)
    const directDebitConnectorMock = nock(process.env.DIRECT_DEBIT_CONNECTOR_URL)

    directDebitConnectorMock.get('/v1/api/accounts/DIRECT_DEBIT:1owehhserwr').times(2).reply(200, {
      bob: 'bob',
      type: 'test',
      payment_provider: 'sandbox'
    })

    supertest(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect(200)
      .expect(data => {
        expect(data.body.currentGatewayAccount).to.deep.equal({
          type: 'test',
          payment_provider: 'sandbox',
          full_type: 'Sandbox test',
          paymentProvider: 'sandbox',
          paymentMethod: 'direct debit'
        })
      })
      .end(done)
  })
})
