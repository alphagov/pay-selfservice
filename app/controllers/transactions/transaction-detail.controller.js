'use strict'

const { NotFoundError } = require('../../errors')
const { ledgerFindWithEvents } = require('../../services/transaction.service')
const { response } = require('../../utils/response.js')

module.exports = async function showTransactionDetails (req, res, next) {
  const accountId = req.account.gateway_account_id
  const chargeId = req.params.chargeId
  try {
    const data = await ledgerFindWithEvents(accountId, chargeId, req.correlationId)
    data.indexFilters = req.session.filters
    if (req.session.contextIsAllServiceTransactions) {
      data.contextIsAllServiceTransactions = req.session.contextIsAllServiceTransactions
      data.allServicesTransactionsStatusFilter = req.session.allServicesTransactionsStatusFilter
      delete req.session.contextIsAllServiceTransactions
    }
    data.service = req.service

    response(req, res, 'transaction-detail/index', data)
  } catch (err) {
    if (err === 'NOT_FOUND') {
      next(new NotFoundError('Transaction was not found in ledger'))
    } else {
      next(new Error('Error getting transaction from ledger'))
    }
  }
}
