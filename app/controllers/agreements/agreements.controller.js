const url = require('url')

const agreementsService = require('./agreements.service')
const transactionService = require('../../services/transaction.service')
const { buildPaymentList } = require('../../utils/transaction-view')

const { response } = require('../../utils/response')
const { RESTClientError, NotFoundError } = require('../../errors')

const LIMIT_NUMBER_OF_TRANSACTIONS_TO_SHOW = 5

async function listAgreements (req, res, next) {
  const page = req.query.page || 1

  const filters = {
    ...req.query.status && { status: req.query.status },
    ...req.query.reference && { reference: req.query.reference.trim() }
  }
  req.session.agreementsFilter = url.parse(req.url).query

  try {
    const agreements = await agreementsService.agreements(req.service.externalId, req.isLive, page, filters)

    response(req, res, 'agreements/list', {
      agreements,
      filters
    })
  } catch (error) {
    if (error instanceof RESTClientError && error.errorCode === 404) {
      next(new NotFoundError('The requested page of results was not found.'))
    } else {
      next(error)
    }
  }
}

async function agreementDetail (req, res, next) {
  const listFilter = req.session.agreementsFilter
  const transactionsFilter = { agreementId: req.params.agreementId, pageSize: LIMIT_NUMBER_OF_TRANSACTIONS_TO_SHOW }

  try {
    const agreement = await agreementsService.agreement(req.params.agreementId, req.service.externalId)
    const transactions = await transactionService.search([req.account.gateway_account_id], transactionsFilter)
    const formattedTransactions = buildPaymentList(transactions, {}, req.account.gateway_account_id, transactionsFilter)

    response(req, res, 'agreements/detail', {
      agreement,
      transactions: formattedTransactions,
      listFilter
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listAgreements,
  agreementDetail
}
