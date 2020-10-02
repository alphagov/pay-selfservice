'use strict'

const request = require('supertest')
const nock = require('nock')

require('../test-helpers/serialize-mock.js')
const userCreator = require('../test-helpers/user-creator.js')
const getApp = require('../../server.js').getApp
const paths = require('../../app/paths.js')
const session = require('../test-helpers/mock-session.js')
const gatewayAccountId = '15486734'
const { validTransactionDetailsResponse } = require('../fixtures/ledger-transaction.fixtures')
let app

const connectorMock = nock(process.env.CONNECTOR_URL)
const CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts/' + gatewayAccountId
const LEDGER_TRANSACTION_PATH = '/v1/transaction/{transactionId}'
const ledgerMock = nock(process.env.LEDGER_URL)

function whenGetRedirectTransactionRoute (transactionId, baseApp) {
  return request(baseApp)
    .get(paths.generateRoute(paths.transactions.redirectDetail, { chargeId: transactionId }))
    .set('Accept', 'application/json')
}

function ledgerTransactionPathFor (transactionId) {
  return LEDGER_TRANSACTION_PATH.replace('{transactionId}', transactionId)
}

describe('The transaction view scenarios', () => {
  afterEach(() => {
    nock.cleanAll()
    app = null
  })

  beforeEach(done => {
    let permissions = 'transactions-details:read'
    let user = session.getUser({
      gateway_account_ids: [gatewayAccountId],
      permissions: [{ name: permissions }]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        'payment_provider': 'sandbox',
        'gateway_account_id': gatewayAccountId,
        'credentials': { 'username': 'a-username' }
      })
  })

  describe('The transaction redirect endpoint', () => {
    it('should return 302 when the user has permissions', done => {
      let transactionId = 888

      const response = validTransactionDetailsResponse({
        transaction_id: transactionId,
        type: 'payment',
        amount: 100,
        fee: 5,
        net_amount: 95,
        refund_summary_available: 100,
        gateway_account_id: gatewayAccountId
      }).getPlain()

      ledgerMock.get(ledgerTransactionPathFor(transactionId))
        .query({
          override_account_id_restriction: true
        })
        .reply(200, response)

      whenGetRedirectTransactionRoute(transactionId, app)
        .expect(302)
        .end(done)
    })

    it(
      'should return 404 when the user does not have permissions',
      done => {
        let transactionId = 888

        const response = validTransactionDetailsResponse({
          transaction_id: transactionId,
          type: 'payment',
          amount: 100,
          fee: 5,
          net_amount: 95,
          refund_summary_available: 100,
          gateway_account_id: 1337
        }).getPlain()

        ledgerMock.get(ledgerTransactionPathFor(transactionId))
          .query({
            override_account_id_restriction: true
          })
          .reply(200, response)

        whenGetRedirectTransactionRoute(transactionId, app)
          .expect(404)
          .end(done)
      }
    )
  })
})
