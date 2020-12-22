'use strict'

const url = require('url')
const _ = require('lodash')

const auth = require('../../services/auth.service.js')
const router = require('../../routes.js')
const transactionService = require('../../services/transaction.service')
const { ConnectorClient } = require('../../services/clients/connector.client.js')
const { buildPaymentList } = require('../../utils/transaction-view.js')
const { response } = require('../../utils/response.js')
const { renderErrorView } = require('../../utils/response.js')
const { getFilters, describeFilters } = require('../../utils/filters.js')
const states = require('../../utils/states')
const client = new ConnectorClient(process.env.CONNECTOR_URL)

const { CORRELATION_HEADER } = require('../../utils/correlation-header.js')

function error (req, res, msg) {
  return renderErrorView(req, res, msg)
}

module.exports = async (req, res, next) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const filters = getFilters(req)

  const correlationId = req.headers[CORRELATION_HEADER] || ''
  req.session.filters = url.parse(req.url).query

  if (!filters.valid) {
    return error(req, res, 'Invalid search')
  }

  let result
  try {
    result = await Promise.all([
      transactionService.search([accountId], filters.result, correlationId),
      client.getAllCardTypes(correlationId)
    ])
  } catch (err) {
    return next(new Error('Unable to retrieve list of transactions or card types'))
  }

  const model = buildPaymentList(result[0], result[1], accountId, filters.result, router.paths.transactions.download)
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

  return response(req, res, 'transactions/index', model)
}
