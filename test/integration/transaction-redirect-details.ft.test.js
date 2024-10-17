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
const { validGatewayAccountResponse } = require('../fixtures/gateway-account.fixtures')

let app

const connectorMock = nock(process.env.CONNECTOR_URL)
const LEDGER_TRANSACTION_PATH = '/v1/transaction/{transactionId}'
const ledgerMock = nock(process.env.LEDGER_URL)
const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'

function whenGetRedirectTransactionRoute (transactionId, baseApp) {
  return request(baseApp)
    .get(paths.generateRoute(paths.allServiceTransactions.redirectDetail, { chargeId: transactionId }))
    .set('Accept', 'application/json')
}

function ledgerTransactionPathFor (transactionId) {
  return LEDGER_TRANSACTION_PATH.replace('{transactionId}', transactionId)
}

describe('The transaction view scenarios', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    const permissions = 'transactions-details:read'
    const user = session.getUser({
      gateway_account_ids: [gatewayAccountId],
      permissions: [{ name: permissions }]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)

    connectorMock.get(`/v1/api/accounts/${gatewayAccountId}`)
      .reply(200, validGatewayAccountResponse(
        {
          external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
          gateway_account_id: gatewayAccountId
        }
      ))
  })

  describe('The transaction redirect endpoint', function () {
    it('should return 302 when the user has permissions', function (done) {
      const transactionId = 888

      const response = validTransactionDetailsResponse({
        transaction_id: transactionId,
        type: 'payment',
        amount: 100,
        fee: 5,
        net_amount: 95,
        refund_summary_available: 100,
        gateway_account_id: gatewayAccountId
      })

      ledgerMock.get(ledgerTransactionPathFor(transactionId))
        .query({
          override_account_id_restriction: true
        })
        .reply(200, response)

      whenGetRedirectTransactionRoute(transactionId, app)
        .expect(302)
        .end(done)
    })

    it('should return 404 when the user does not have permissions', function (done) {
      const transactionId = 888

      const response = validTransactionDetailsResponse({
        transaction_id: transactionId,
        type: 'payment',
        amount: 100,
        fee: 5,
        net_amount: 95,
        refund_summary_available: 100,
        gateway_account_id: 1337
      })

      ledgerMock.get(ledgerTransactionPathFor(transactionId))
        .query({
          override_account_id_restriction: true
        })
        .reply(200, response)

      whenGetRedirectTransactionRoute(transactionId, app)
        .expect(404)
        .end(done)
    })
  })
})
