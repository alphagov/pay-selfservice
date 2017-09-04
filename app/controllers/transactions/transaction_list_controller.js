'use strict'

// Core Dependencies
const url = require('url')

// Local Dependencies
const auth = require('../../services/auth_service.js')
const router = require('../../routes.js')
const transactionService = require('../../services/transaction_service')
const {ConnectorClient} = require('../../services/clients/connector_client.js')
const {buildPaymentList} = require('../../utils/transaction_view.js')
const {response} = require('../../utils/response.js')
const {renderErrorView} = require('../../utils/response.js')
const {getFilters, describeFilters} = require('../../utils/filters.js')
const states = require('../../utils/states')
const client = new ConnectorClient(process.env.CONNECTOR_URL)

const {CORRELATION_HEADER} = require('../../utils/correlation_header.js')

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
        .getAllCardTypes({correlationId}, allCards => {
          const model = buildPaymentList(transactions, allCards, accountId, filters.result)
          model.search_path = router.paths.transactions.index
          model.filtersDescription = describeFilters(filters.result)
          model.eventStates = req.user.hasFeature('REFUNDS_IN_TX_LIST') ? states.states() : states.payment_states()
          model.eventStates.forEach(state => {
            const relevantFilter = (state.type === 'payment' ? filters.result.payment_states : filters.result.refund_states) || []
            state.value.selected = relevantFilter.includes(state.name)
          })
          response(req, res, 'transactions/index', model)
        })
        .on('connectorError', () => error('Unable to retrieve card types.'))
    })
    .catch(() => error('Unable to retrieve list of transactions.'))

  function error (msg) {
    renderErrorView(req, res, msg)
  }
}
