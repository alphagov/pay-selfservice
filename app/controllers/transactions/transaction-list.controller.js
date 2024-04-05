'use strict'

const url = require('url')
const _ = require('lodash')

const router = require('../../routes.js')
const transactionService = require('../../services/transaction.service')
const { ConnectorClient } = require('../../services/clients/connector.client.js')
const { buildPaymentList } = require('../../utils/transaction-view.js')
const { response } = require('../../utils/response.js')
const { getFilters, describeFilters } = require('../../utils/filters.js')
const states = require('../../utils/states')
const client = new ConnectorClient(process.env.CONNECTOR_URL)
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

module.exports = async function showTransactionList (req, res, next) {
  const accountId = req.account.gateway_account_id
  const gatewayAccountExternalId = req.account.external_id
  const filters = getFilters(req)
  const EMPTY_TRANSACTION_SEARCH_RESULTS = {
    total: 0,
    count: 0,
    page: 1,
    results: [],
    _links: {},
    filters: {}
  }
  req.session.filters = url.parse(req.url).query

  if (!filters.valid) {
    return next(new Error('Invalid search'))
  }

  let result
  let transactionSearchResults = (filters.dateRangeState.isInvalidDateRange)
    ? EMPTY_TRANSACTION_SEARCH_RESULTS : transactionService.search([accountId], filters.result)
  try {
    result = await Promise.all([ transactionSearchResults, client.getAllCardTypes() ])
  } catch (error) {
    return next(error)
  }

  const transactionsDownloadLink = formatAccountPathsFor(router.paths.account.transactions.download, req.account.external_id)
  const model = buildPaymentList(result[0], result[1], req.user.getTimeZone(), gatewayAccountExternalId, filters.result, filters.dateRangeState, transactionsDownloadLink)
  model.search_path = formatAccountPathsFor(router.paths.account.transactions.index, req.account.external_id)
  model.filtersDescription = describeFilters(filters.result)

  const includeDisputeStatuses = (req.account.payment_provider === 'stripe')
  model.eventStates = states.allDisplayStateSelectorObjects(includeDisputeStatuses)
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
  model.clearRedirect = formatAccountPathsFor(router.paths.account.transactions.index, req.account.external_id)
  model.isStripeAccount = req.account.payment_provider === 'stripe'
  model.isExperimentalFeaturesEnabled = req.service.experimentalFeaturesEnabled
  model.recurringEnabled = req.account.recurring_enabled

  return response(req, res, 'transactions/index', model)
}
