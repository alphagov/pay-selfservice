var response = require('../../utils/response.js').response
var renderErrorView = require('../../utils/response.js').renderErrorView
var transactionView = require('../../utils/transaction_view.js')
var jsonToCsv = require('../../utils/json_to_csv.js')
var auth = require('../../services/auth_service.js')
var date = require('../../utils/dates.js')
var logger = require('winston')
var router = require('../../routes.js')
var Transaction = require('../../models/transaction.js')
var getFilters = require('../../utils/filters.js').getFilters
var url = require('url')
var ConnectorClient = require('../../services/clients/connector_client.js').ConnectorClient
var client = new ConnectorClient(process.env.CONNECTOR_URL)
var CORRELATION_HEADER = require('../../utils/correlation_header.js').CORRELATION_HEADER

module.exports = {

  index: function (req, res) {
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
  },

  download: function (req, res) {
    var accountId = auth.getCurrentGatewayAccountId(req)
    var filters = req.query
    var name = 'GOVUK Pay ' + date.dateToDefaultFormat(new Date()) + '.csv'

    var init = function () {
      var transactionModel = Transaction(req.headers[CORRELATION_HEADER])
      transactionModel.searchAll(accountId, filters)
          .then(toCsv)
          .then(render)
          .catch(error)
    }

    var toCsv = function (json) {
      return jsonToCsv(json.results)
    }

    var render = function (csv) {
      logger.debug('Sending csv attachment download -', {'filename': name})
      res.setHeader('Content-disposition', 'attachment; filename=' + name)
      res.setHeader('Content-Type', 'text/csv')
      res.send(csv)
    }

    var error = function (connectorError) {
      var msg = (connectorError) ? 'Internal server error'
          : 'Unable to download list of transactions.'
      renderErrorView(req, res, msg)
    }

    init()
  }
}
