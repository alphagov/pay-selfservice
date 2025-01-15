const url = require('url')

const agreementsService = require('./agreements.service')
const transactionService = require('../../services/transaction.service')
const { buildPaymentList } = require('../../utils/transaction-view')
const formatFutureStrategyAccountPathsFor = require('../../utils/format-future-strategy-account-paths-for')
const paths = require('../../paths')

const { response } = require('../../utils/response')
const { NotFoundError } = require('../../errors')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')

const LIMIT_NUMBER_OF_TRANSACTIONS_TO_SHOW = 5

async function listAgreements (req, res, next) {
  const page = req.query.page || 1

  const filters = {
    ...req.query.status && { status: req.query.status },
    ...req.query.reference && { reference: req.query.reference.trim() }
  }
  // eslint-disable-next-line n/no-deprecated-api
  req.session.agreementsFilter = url.parse(req.url).query // TODO update this as url.parse is deprecated

  try {
    const agreements = await agreementsService.agreements(req.service.externalId, req.isLive, req.account.gateway_account_id, page, filters)

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

    const user = req.user
    const isShowCancelAgreementFunctionality = user.hasPermission(req.service.externalId, 'agreements:update') &&
      (agreement.status === 'ACTIVE')

    response(req, res, 'agreements/detail', {
      agreement,
      transactions: formattedTransactions,
      listFilter,
      isShowCancelAgreementFunctionality
    })
  } catch (error) {
    next(error)
  }
}

async function cancelAgreement (req, res, next) {
  try {
    await agreementsService.cancelAgreement(
      req.account.gateway_account_id,
      req.params.agreementId,
      req.user.email,
      req.user.externalId
    )

    req.flash('generic', 'Agreement cancelled')

    return res.redirect(
      formatFutureStrategyAccountPathsFor(
        paths.futureAccountStrategy.agreements.detail,
        req.account.type,
        req.service.externalId,
        req.account.external_id,
        req.params.agreementId)
    )
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listAgreements,
  agreementDetail,
  cancelAgreement
}
