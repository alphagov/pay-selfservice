var renderErrorView = require('../../utils/response.js').renderErrorView
var jsonToCsv = require('../../utils/json_to_csv.js')
var auth = require('../../services/auth_service.js')
var date = require('../../utils/dates.js')
var logger = require('winston')
var Transaction = require('../../models/transaction.js')
var CORRELATION_HEADER = require('../../utils/correlation_header.js').CORRELATION_HEADER

module.exports = {

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
