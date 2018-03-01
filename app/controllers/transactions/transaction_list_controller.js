'use strict'

// Core Dependencies
const url = require('url')
const _ = require('lodash')

// Local Dependencies
const auth = require('../../services/auth_service.js')
const router = require('../../routes.js')
const transactionService = require('../../services/transaction_service')
const {ConnectorClient} = require('../../services/clients/connector_client.js')
const {buildPaymentList} = require('../../utils/transaction_view.js')
const {response} = require('../../utils/response.js')
const {renderErrorView} = require('../../utils/response.js')
const {old_getFilters, old_describeFilters, getFilters, describeFilters} = require('../../utils/filters.js')
const states = require('../../utils/states')
const client = new ConnectorClient(process.env.CONNECTOR_URL)

const {CORRELATION_HEADER} = require('../../utils/correlation_header.js')
const NEW_CHARGE_STATUS_FEATURE_HEADER = 'NEW_CHARGE_STATUS_ENABLED'

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const newChargeStatusEnabled = req.user.hasFeature(NEW_CHARGE_STATUS_FEATURE_HEADER)
  let filters = {}
  if (!newChargeStatusEnabled) {
    filters = old_getFilters(req)
  } else {
    filters = getFilters(req)
  }
  filters.result.newChargeStatusEnabled = newChargeStatusEnabled

  const correlationId = req.headers[CORRELATION_HEADER] || ''
  req.session.filters = url.parse(req.url).query
  if (!filters.valid) return error('Invalid search')

  transactionService
    .search(accountId, filters.result, correlationId)
    .then(transactions => {
      client
        .getAllCardTypes({correlationId}, allCards => {
          const model = buildPaymentList(transactions, allCards, accountId, filters.result)
          model.search_path = router.paths.transactions.index
          if (!filters.result.newChargeStatusEnabled) {
            model.filtersDescription = old_describeFilters(filters.result)
            model.eventStates = states.old_states()
            model.eventStates.forEach(state => {
              const relevantFilter = (state.type === 'payment' ? filters.result.payment_states : filters.result.refund_states) || []
              state.value.selected = relevantFilter.includes(state.name)
            })
          } else {
            model.filtersDescription = describeFilters(filters.result)
            model.eventStates = states.allDisplayStateSelectorObjects()
            model.eventStates.forEach(state => {
              state.value.selected = filters.selectedStates.includes(state.name)
            })
          }

          model.stateFiltersFriendly = model.eventStates
            .filter(state => state.value.selected)
            .map(state => state.value.text)
            .join(', ')
          if (_.has(filters.result, 'brand')) {
            model.cardBrands.forEach(brand => {
              brand.value.selected = filters.result.brand.includes(brand.key)
            })
          }
          response(req, res, 'transactions/index', model)
        })
        .on('connectorError', () => error('Unable to retrieve card types.'))
    })
    .catch(() => error('Unable to retrieve list of transactions.'))

  function error (msg) {
    renderErrorView(req, res, msg)
  }
}
