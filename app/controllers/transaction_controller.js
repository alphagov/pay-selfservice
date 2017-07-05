const response = require('../utils/response.js').response
const renderErrorView = require('../utils/response.js').renderErrorView
const transactionView = require('../utils/transaction_view.js')
const jsonToCsv = require('../utils/json_to_csv.js')
const auth = require('../services/auth_service.js')
const date = require('../utils/dates.js')
const logger = require('winston')
const router = require('../routes.js')
const Transaction = require('../models/transaction.js')
const Charge = require('../models/charge.js')
const getFilters = require('../utils/filters.js').getFilters
const url = require('url')
const ConnectorClient = require('../services/clients/connector_client.js').ConnectorClient
const client = new ConnectorClient(process.env.CONNECTOR_URL)
const CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER

module.exports = {

  index: function (req, res) {
    const accountId = auth.getCurrentGatewayAccountId(req)
    const filters = getFilters(req)
    const correlationId = req.headers[CORRELATION_HEADER] || ''

    req.session.filters = url.parse(req.url).query
    const init = function () {
      if (!filters.valid) return error('Invalid search')
      var transactionModel = Transaction(req.headers[CORRELATION_HEADER])
      transactionModel
        .search(accountId, filters.result)
        .then(onSuccessSearchTransactions, () => error('Unable to retrieve list of transactions.'))
    }

    const onSuccessSearchTransactions = function (transactions) {
      const onSuccessGetAllCards = function (allCards) {
        transactions.search_path = router.paths.transactions.index
        const model = transactionView.buildPaymentList(transactions, allCards, accountId, filters.result)
        response(req, res, 'transactions/index', model)
      }

      const params = {
        correlationId: correlationId
      }

      client
        .getAllCardTypes(params, onSuccessGetAllCards)
        .on('connectorError', () => error('Unable to retrieve card types.'))
    }

    const error = function (msg) {
      renderErrorView(req, res, msg)
    }

    init()
  },

  download: function (req, res) {
    const accountId = auth.getCurrentGatewayAccountId(req)
    const filters = req.query
    const name = 'GOVUK Pay ' + date.dateToDefaultFormat(new Date()) + '.csv'

    const init = function () {
      var transactionModel = Transaction(req.headers[CORRELATION_HEADER])
      transactionModel.searchAll(accountId, filters)
          .then(toCsv)
          .then(render)
          .catch(error)
    }

    const toCsv = function (json) {
      return jsonToCsv(json.results)
    }

    const render = function (csv) {
      logger.debug('Sending csv attachment download -', {'filename': name})
      res.setHeader('Content-disposition', 'attachment; filename=' + name)
      res.setHeader('Content-Type', 'text/csv')
      res.send(csv)
    }

    const error = function (connectorError) {
      var msg = (connectorError) ? 'Internal server error'
          : 'Unable to download list of transactions.'
      renderErrorView(req, res, msg)
    }

    init()
  },

  show: function (req, res) {
    const accountId = auth.getCurrentGatewayAccountId(req)
    const chargeId = req.params.chargeId
    const defaultMsg = 'Error processing transaction view'
    const notFound = 'Charge not found'
    const init = function () {
      const chargeModel = Charge(req.headers[CORRELATION_HEADER])
      chargeModel.findWithEvents(accountId, chargeId)
          .then(render, error)
    }

    const render = function (data) {
      data.indexFilters = req.session.filters
      response(req, res, 'transactions/show', data)
    }

    const error = function (err) {
      var msg = (err === 'NOT_FOUND') ? notFound : defaultMsg
      renderErrorView(req, res, msg)
    }

    init()
  },

  refund: function (req, res) {
    const accountId = auth.getCurrentGatewayAccountId(req)
    const chargeId = req.params.chargeId
    const show = router.generateRoute(router.paths.transactions.show, {
      chargeId: chargeId
    })

    const refundAmount = (req.body['refund-type'] === 'full') ? req.body['full-amount'] : req.body['refund-amount']
    const refundAmountAvailableInPence = parseInt(req.body['refund-amount-available-in-pence'])
    const refundMatch = /^([0-9]+)(?:\.([0-9]{2}))?$/.exec(refundAmount)

    if (refundMatch) {
      let refundAmountForConnector = parseInt(refundMatch[1]) * 100
      if (refundMatch[2]) refundAmountForConnector += parseInt(refundMatch[2])

      const errReasonMessages = {
        'REFUND_FAILED': "Can't process refund",
        'full': "Can't do refund: This charge has been already fully refunded",
        'amount_not_available': "Can't do refund: The requested amount is bigger than the amount available for refund",
        'amount_min_validation': "Can't do refund: The requested amount is less than the minimum accepted for issuing a refund for this charge",
        'refund_amount_available_mismatch': 'Refund failed. This refund request has already been submitted.'
      }

      const chargeModel = Charge(req.headers[CORRELATION_HEADER])
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
