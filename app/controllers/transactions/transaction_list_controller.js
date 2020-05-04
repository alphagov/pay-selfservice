'use strict'

// Core Dependencies
const url = require('url')
const _ = require('lodash')

// Local Dependencies
const auth = require('../../services/auth_service.js')
const router = require('../../routes.js')
const transactionService = require('../../services/transaction_service')
const { ConnectorClient } = require('../../services/clients/connector_client.js')
const { buildPaymentList } = require('../../utils/transaction_view.js')
const { response } = require('../../utils/response.js')
const { renderErrorView } = require('../../utils/response.js')
const { getFilters, describeFilters } = require('../../utils/filters.js')
const states = require('../../utils/states')
const client = new ConnectorClient(process.env.CONNECTOR_URL)

const { CORRELATION_HEADER } = require('../../utils/correlation_header.js')

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const filters = getFilters(req)

  const correlationId = req.headers[CORRELATION_HEADER] || ''
  req.session.filters = url.parse(req.url).query
  if (!filters.valid) return error('Invalid search')

  transactionService
    .search(accountId, filters.result, correlationId)
    .then(transactions => {
      client
        .getAllCardTypes({ correlationId }, allCards => {
          const model = buildPaymentList(transactions, allCards, accountId, filters.result, router.paths.transactions.download)
          model.search_path = router.paths.transactions.index
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
          model.clearRedirect = router.paths.transactions.index
          model.isStripeAccount = req.account.payment_provider === 'stripe'
          response(req, res, 'transactions/index', model)
        })
        .on('connectorError', () => error('Unable to retrieve card types.'))
    })
    .catch(() => error('Unable to retrieve list of transactions.'))

  function error (msg) {
    renderErrorView(req, res, msg)
  }
}
