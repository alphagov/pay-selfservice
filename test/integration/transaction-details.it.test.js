'use strict'

const sinon = require('sinon')
const nock = require('nock')

const gatewayAccountId = '15486734'
const { validGatewayAccountResponse } = require('../fixtures/gateway-account.fixtures')
const transactionDetailController = require('../../app/controllers/transactions/transaction-detail.controller')
const { NotFoundError } = require('../../app/errors')

const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'
const LEDGER_TRANSACTION_PATH = '/v1/transaction/{transactionId}?account_id=' + gatewayAccountId
const ledgerMock = nock(process.env.LEDGER_URL)

function ledgerTransactionPathFor (transactionId) {
  return LEDGER_TRANSACTION_PATH.replace('{transactionId}', transactionId)
}

describe('The transaction view scenarios', () => {
  const transactionId = 'a-transaction-id'
  const account = validGatewayAccountResponse(
    {
      external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
      gateway_account_id: gatewayAccountId,
      payment_provider: 'sandbox',
      credentials: { 'username': 'a-username' }
    }
  )
  const req = {
    account,
    session: {},
    params: { chargeId: transactionId }
  }
  const res = {}
  let next

  afterEach(() => {
    nock.cleanAll()
  })

  beforeEach(() => {
    next = sinon.spy()
  })

  describe('The transaction history endpoint', () => {
    it('should return transaction not found if a non existing transaction id requested', async () => {
      const ledgerError = { 'message': 'HTTP 404 Not Found' }
      ledgerMock.get(ledgerTransactionPathFor(transactionId))
        .reply(404, ledgerError)

      await transactionDetailController(req, res, next)
      const expectedError = sinon.match.instanceOf(NotFoundError)
        .and(sinon.match.has('message', 'Transaction was not found in ledger'))
      sinon.assert.calledWith(next, expectedError)
    })

    it('should return a generic error if ledger responds with an error', async () => {
      const ledgerError = { 'message': 'Internal server error' }
      ledgerMock.get(ledgerTransactionPathFor(transactionId))
        .reply(500, ledgerError)

      await transactionDetailController(req, res, next)
      const expectedError = sinon.match.instanceOf(Error)
        .and(sinon.match.has('message', 'Error getting transaction from ledger'))
      sinon.assert.calledWith(next, expectedError)
    })

    it('should return a generic error if unable to communicate with ledger', async () => {
      await transactionDetailController(req, res, next)
      const expectedError = sinon.match.instanceOf(Error)
        .and(sinon.match.has('message', 'Error getting transaction from ledger'))
      sinon.assert.calledWith(next, expectedError)
    })
  })
})
