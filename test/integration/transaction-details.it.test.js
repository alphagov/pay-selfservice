'use strict'

const request = require('supertest')
const nock = require('nock')

require('../test-helpers/serialize-mock.js')
const userCreator = require('../test-helpers/user-creator.js')
const getApp = require('../../server.js').getApp
const paths = require('../../app/paths.js')
const session = require('../test-helpers/mock-session.js')
const gatewayAccountId = '15486734'
const formatAccountPathsFor = require('../../app/utils/format-account-paths-for')
const { validGatewayAccountResponse } = require('../fixtures/gateway-account.fixtures')

let app

const connectorMock = nock(process.env.CONNECTOR_URL)
const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'
const LEDGER_TRANSACTION_PATH = '/v1/transaction/{transactionId}?account_id=' + gatewayAccountId
const ledgerMock = nock(process.env.LEDGER_URL)

function whenGetTransactionHistory (transactionId, baseApp) {
  return request(baseApp)
    .get(formatAccountPathsFor(paths.account.transactions.detail, EXTERNAL_GATEWAY_ACCOUNT_ID, transactionId))
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

    connectorMock.get(`/v1/frontend/accounts/external-id/${EXTERNAL_GATEWAY_ACCOUNT_ID}`)
      .reply(200, validGatewayAccountResponse(
        {
          external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
          gateway_account_id: gatewayAccountId,
          payment_provider: 'sandbox',
          credentials: { 'username': 'a-username' }
        }
      ))
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

    it('should return a generic error if unable to communicate with ledger', function (done) {
      let transactionId = 452345
      whenGetTransactionHistory(transactionId, app)
        .expect(500, { 'message': 'Error processing transaction view' })
        .end(done)
    })
  })
})
