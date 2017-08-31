'use strict'

const response = require('../../utils/response.js').response
const renderErrorView = require('../../utils/response.js').renderErrorView
const transactionView = require('../../utils/transaction_view.js')
const auth = require('../../services/auth_service.js')
const router = require('../../routes.js')
const Transaction = require('../../models/transaction.js')
const getFilters = require('../../utils/filters.js').getFilters
const url = require('url')
const ConnectorClient = require('../../services/clients/connector_client.js').ConnectorClient
const client = new ConnectorClient(process.env.CONNECTOR_URL)
const CORRELATION_HEADER = require('../../utils/correlation_header.js').CORRELATION_HEADER


module.exports = (req, res) => {
  var accountId = auth.getCurrentGatewayAccountId(req)
  var filters = getFilters(req)
  var correlationId = req.headers[CORRELATION_HEADER] || ''

  req.session.filters = url.parse(req.url).query
  var init = function () {
    if (!filters.valid) return error('Invalid search')
    var transactionModel = Transaction(req.headers[CORRELATION_HEADER])
    transactionModel
      .search(accountId, filters.result)
      .then(onSuccessSearchTransactions, () => error('Unable to retrieve list of transactions.'))
  }

  var onSuccessSearchTransactions = function (transactions) {
    var onSuccessGetAllCards = function (allCards) {
      transactions.search_path = router.paths.transactions.index
      var model = transactionView.buildPaymentList(transactions, allCards, accountId, filters.result)
      response(req, res, 'transactions/index', model)
    }

    var params = {
      correlationId: correlationId
    }

    client
      .getAllCardTypes(params, onSuccessGetAllCards)
      .on('connectorError', () => error('Unable to retrieve card types.'))
  }

  var error = function (msg) {
    renderErrorView(req, res, msg)
  }

  init()
}