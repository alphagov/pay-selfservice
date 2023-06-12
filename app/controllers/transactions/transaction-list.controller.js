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

  req.session.filters = new url.URL(req.url).search.replace('?', '')

  if (!filters.valid) {
    return next(new Error('Invalid search'))
  }

  let result
  try {
    result = await Promise.all([
      transactionService.search([accountId], filters.result),
      client.getAllCardTypes()
    ])
  } catch (err) {
    return next(new Error('Unable to retrieve list of transactions or card types'))
  }

  const transactionsDownloadLink = formatAccountPathsFor(router.paths.account.transactions.download, req.account.external_id)
  const model = buildPaymentList(result[0], result[1], gatewayAccountExternalId, filters.result, transactionsDownloadLink)
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
