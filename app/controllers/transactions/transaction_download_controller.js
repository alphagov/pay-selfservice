'use strict'

// NPM Dependencies
const logger = require('winston')

// Local Dependencies
const transactionService = require('../../services/transaction_service')
const jsonToCsv = require('../../utils/json_to_csv.js')
const auth = require('../../services/auth_service.js')
const date = require('../../utils/dates.js')
const {renderErrorView} = require('../../utils/response.js')
const {CORRELATION_HEADER} = require('../../utils/correlation_header.js')

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const filters = req.query
  const name = `GOVUK Pay ${date.dateToDefaultFormat(new Date())}.csv`
  const correlationId = req.headers[CORRELATION_HEADER]

  transactionService.searchAll(accountId, filters, correlationId)
    .then(json => jsonToCsv(json.results))
    .then(csv => {
      logger.debug('Sending csv attachment download -', {'filename': name})
      res.setHeader('Content-disposition', 'attachment; filename=' + name)
      res.setHeader('Content-Type', 'text/csv')
      res.send(csv)
    })
    .catch(err => renderErrorView(req, res, err ? 'Internal server error' : 'Unable to download list of transactions.'))
}
