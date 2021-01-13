'use strict'

const transactionService = require('../../services/transaction.service')
const auth = require('../../services/auth.service')
const date = require('../../utils/dates')
const { renderErrorView } = require('../../utils/response')
const { CORRELATION_HEADER } = require('../../utils/correlation-header')
const Stream = require('../../services/clients/stream.client')

const fetchTransactionCsvWithHeader = function fetchTransactionCsvWithHeader (req, res) {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const filters = req.query
  const name = `GOVUK_Pay_${date.dateToDefaultFormat(new Date()).replace(' ', '_')}.csv`
  const correlationId = req.headers[CORRELATION_HEADER]

  filters.feeHeaders = req.account && req.account.payment_provider === 'stripe'
  filters.motoHeader = req.account && req.account.allow_moto
  const url = transactionService.csvSearchUrl(filters, accountId)

  const timestampStreamStart = Date.now()
  const data = (chunk) => { res.write(chunk) }
  const complete = () => {
    transactionService.logCsvFileStreamComplete(timestampStreamStart, filters, [accountId], req.user, correlationId, false)
    res.end()
  }
  const error = () => renderErrorView(req, res, 'Unable to download list of transactions.')
  const client = new Stream(data, complete, error)

  res.setHeader('Content-disposition', `attachment; filename="${name}"`)
  res.setHeader('Content-Type', 'text/csv')

  client.request(url, correlationId)
}

module.exports = fetchTransactionCsvWithHeader
