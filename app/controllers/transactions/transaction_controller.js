var response = require('../../utils/response.js').response
var renderErrorView = require('../../utils/response.js').renderErrorView
var transactionView = require('../../utils/transaction_view.js')
var jsonToCsv = require('../../utils/json_to_csv.js')
var auth = require('../../services/auth_service.js')
var date = require('../../utils/dates.js')
var logger = require('winston')
var router = require('../../routes.js')
var Transaction = require('../../models/transaction.js')
var Charge = require('../../models/charge.js')
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
  },

  refund: function (req, res) {
    var accountId = auth.getCurrentGatewayAccountId(req)
    var chargeId = req.params.chargeId
    var show = router.generateRoute(router.paths.transactions.detail, {
      chargeId: chargeId
    })

    var refundAmount = (req.body['refund-type'] === 'full') ? req.body['full-amount'] : req.body['refund-amount']
    var refundAmountAvailableInPence = parseInt(req.body['refund-amount-available-in-pence'])
    var refundMatch = /^([0-9]+)(?:\.([0-9]{2}))?$/.exec(refundAmount)

    if (refundMatch) {
      var refundAmountForConnector = parseInt(refundMatch[1]) * 100
      if (refundMatch[2]) refundAmountForConnector += parseInt(refundMatch[2])

      var errReasonMessages = {
        'REFUND_FAILED': "Can't process refund",
        'full': "Can't do refund: This charge has been already fully refunded",
        'amount_not_available': "Can't do refund: The requested amount is bigger than the amount available for refund",
        'amount_min_validation': "Can't do refund: The requested amount is less than the minimum accepted for issuing a refund for this charge",
        'refund_amount_available_mismatch': 'Refund failed. This refund request has already been submitted.'
      }

      var chargeModel = Charge(req.headers[CORRELATION_HEADER])
      chargeModel.refund(accountId, chargeId, refundAmountForConnector, refundAmountAvailableInPence)
        .then(function () {
          res.redirect(show)
        }, function (err) {
          var msg = errReasonMessages[err] ? errReasonMessages[err] : errReasonMessages.REFUND_FAILED
          renderErrorView(req, res, msg)
        })
    } else {
      renderErrorView(req, res, "Can't do refund: amount must be pounds (10) or pounds and pence (10.10)")
    }
  }
}
