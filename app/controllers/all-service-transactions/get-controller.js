'use strict'

// NPM dependencies
const _ = require('lodash')

const { response, renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector_client.js')
const transactionService = require('../../services/transaction_service')
const { buildPaymentList } = require('../../utils/transaction_view.js')
const { liveUserServicesGatewayAccounts } = require('./../../utils/valid_account_id')
const { getFilters, describeFilters } = require('../../utils/filters.js')
const router = require('../../routes.js')
const states = require('../../utils/states')
const client = new ConnectorClient(process.env.CONNECTOR_URL)

const { CORRELATION_HEADER } = require('../../utils/correlation_header.js')

module.exports = async (req, res) => {
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  const filters = getFilters(req)
  try {
    const accountIdsUsersHasPermissionsFor = liveUserServicesGatewayAccounts(req.user)
    const searchFilters = { ...filters.result, live: true }
    const searchResultOutput = await transactionService.search(accountIdsUsersHasPermissionsFor, searchFilters)
    const cardTypes = await client.getAllCardTypesPromise(correlationId)
    const model = buildPaymentList(searchResultOutput, cardTypes, null, filters.result, router.paths.allServiceTransactions.download, req.session.backPath)
    delete req.session.backPath
    model.search_path = router.paths.allServiceTransactions.index
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
    model.filterRedirect = router.paths.allServiceTransactions.index
    model.clearRedirect = router.paths.allServiceTransactions.index
    return response(req, res, 'all_service_transactions/index', model)
  } catch (err) {
    renderErrorView(req, res, 'Unable to fetch transaction information')
  }
}
