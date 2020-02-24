'use strict'

const request = require('supertest')
const nock = require('nock')

require('../test_helpers/serialize_mock.js')
const userCreator = require('../test_helpers/user_creator.js')
const getApp = require('../../server.js').getApp
const paths = require('../../app/paths.js')
const session = require('../test_helpers/mock_session.js')
const gatewayAccountId = '15486734'

let app

const connectorMock = nock(process.env.CONNECTOR_URL)
const CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts/' + gatewayAccountId
const LEDGER_TRANSACTION_PATH = '/v1/transaction/{transactionId}?account_id=' + gatewayAccountId
const ledgerMock = nock(process.env.LEDGER_URL)

function whenGetTransactionHistory (transactionId, baseApp) {
  return request(baseApp)
    .get(paths.generateRoute(paths.transactions.detail, { chargeId: transactionId }))
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

  describe('The transaction history endpoint', function () {
    it('should return transaction not found if a non existing transaction id requested', function (done) {
      let nonExistentTransactionId = 888
      let ledgerError = { 'message': 'HTTP 404 Not Found' }
      ledgerMock.get(ledgerTransactionPathFor(nonExistentTransactionId))
        .reply(404, ledgerError)

      whenGetTransactionHistory(nonExistentTransactionId, app)
        .expect(404, { 'message': 'Charge not found' })
        .end(done)
    })

    it('should return a generic error if ledger responds with an error', function (done) {
      let transactionId = 888
      let ledgerError = { 'message': 'Internal server error' }
      ledgerMock.get(ledgerTransactionPathFor(transactionId))
        .reply(500, ledgerError)

      whenGetTransactionHistory(transactionId, app)
        .expect(500, { 'message': 'Error processing transaction view' })
        .end(done)
    })
  })
})
