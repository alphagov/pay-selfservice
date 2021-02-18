'use strict'

const _ = require('lodash')

const { response } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client.js')
const transactionService = require('../../services/transaction.service')
const { buildPaymentList } = require('../../utils/transaction-view.js')
const permissions = require('../../utils/permissions')
const { getFilters, describeFilters } = require('../../utils/filters.js')
const paths = require('../../paths')
const states = require('../../utils/states')
const client = new ConnectorClient(process.env.CONNECTOR_URL)
const logger = require('../../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const { NoServicesWithPermissionError } = require('../../errors')

const { CORRELATION_HEADER } = require('../../utils/correlation-header.js')

module.exports = async function getTransactionsForAllServices (req, res, next) {
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  const filters = getFilters(req)

  // a filter param will be set on status specific routes, if they're not set the
  // default behaviour should be live
  const { statusFilter } = req.params
  const filterLiveAccounts = statusFilter !== 'test'

  try {
    const userPermittedAccountsSummary = await permissions.getGatewayAccountsFor(req.user, filterLiveAccounts, 'transactions:read')

    const logContext = {
      gateway_account_ids: userPermittedAccountsSummary.gatewayAccountIds,
      user_number_of_live_services: req.user.numberOfLiveServices,
      internal_user: req.user.internalUser
    }
    logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId
    logContext[keys.CORRELATION_ID] = correlationId
    logger.info('Listing all live services transactions', logContext)

    if (!userPermittedAccountsSummary.gatewayAccountIds.length) {
      return next(new NoServicesWithPermissionError('You do not have any associated services with rights to view these transactions.'))
    }
    const searchResultOutput = await transactionService.search(userPermittedAccountsSummary.gatewayAccountIds, filters.result)
    const cardTypes = await client.getAllCardTypes(correlationId)
    const route = filterLiveAccounts ? paths.allServiceTransactions.download : paths.formattedPathFor(paths.allServiceTransactions.downloadStatusFilter, 'test')
    const model = buildPaymentList(searchResultOutput, cardTypes, null, filters.result, route, req.session.backPath)
    delete req.session.backPath
    model.search_path = filterLiveAccounts ? paths.allServiceTransactions.index : paths.formattedPathFor(paths.allServiceTransactions.indexStatusFilter, 'test')
    model.filtersDescription = describeFilters(filters.result)
    model.eventStates = states.allDisplayStateSelectorObjects()
      .map(state => {
        return {
          value: state.key,
          text: state.name,
          selected: filters.result.selectedStates && filters.result.selectedStates.includes(state.name)
        }
      })
    model.eventStates.unshift({ value: '', text: 'Any', selected: false })

    model.stateFiltersFriendly = model.eventStates
      .filter(state => state.selected)
      .map(state => state.text)
      .join(', ')
    if (_.has(filters.result, 'brand')) {
      model.cardBrands.forEach(brand => {
        brand.selected = filters.result.brand.includes(brand.value)
      })
    }
    model.clearRedirect = model.search_path
    model.isStripeAccount = userPermittedAccountsSummary.headers.shouldGetStripeHeaders
    model.allServiceTransactions = true

    return response(req, res, 'transactions/index', model)
  } catch (err) {
    next(new Error('Unable to fetch transaction information'))
  }
}
