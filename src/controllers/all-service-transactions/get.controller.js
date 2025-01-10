'use strict'

const url = require('url')

const { response } = require('../../utils/response')
const transactionService = require('../../services/transaction.service')
const permissions = require('../../utils/permissions')
const { getFilters } = require('../../utils/filters.js')
const paths = require('../../paths')

const logger = require('../../utils/logger')(__filename)
const { NoServicesWithPermissionError } = require('../../errors')
const { populateModel } = require('./populateModel.js')

module.exports = async function getTransactionsForAllServices (req, res, next) {
  const filters = getFilters(req)

  // a filter param will be set on status specific routes, if they're not set the
  // default behaviour should be live
  const { statusFilter } = req.params
  const filterLiveAccounts = statusFilter !== 'test'
  // eslint-disable-next-line n/no-deprecated-api
  req.session.filters = url.parse(req.url).query // TODO update this as url.parse is deprecated
  req.session.allServicesTransactionsStatusFilter = statusFilter

  try {
    const userPermittedAccountsSummary = await permissions.getGatewayAccountsFor(req.user, filterLiveAccounts, 'transactions:read')

    logger.info('Listing all services transactions', {
      gateway_account_ids: userPermittedAccountsSummary.gatewayAccountIds,
      user_number_of_live_services: req.user.numberOfLiveServices,
      is_live: filterLiveAccounts
    })

    if (!userPermittedAccountsSummary.gatewayAccountIds.length) {
      return next(new NoServicesWithPermissionError('You do not have any associated services with rights to view these transactions.'))
    }

    let searchResultOutput
    try {
      searchResultOutput = await transactionService.search(userPermittedAccountsSummary.gatewayAccountIds, filters.result, true)
    } catch (error) {
      return next(error)
    }

    const downloadRoute = filterLiveAccounts ? paths.allServiceTransactions.download : paths.formattedPathFor(paths.allServiceTransactions.downloadStatusFilter, 'test')
    const model = await populateModel(req, searchResultOutput, filters, downloadRoute, filterLiveAccounts, userPermittedAccountsSummary)

    return response(req, res, 'transactions/index', model)
  } catch (err) {
    next(new Error('Unable to fetch transaction information'))
  }
}
