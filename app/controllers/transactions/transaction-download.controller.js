'use strict'

const transactionService = require('../../services/transaction.service')
const date = require('../../utils/dates')
const { renderErrorView } = require('../../utils/response')
const { CORRELATION_HEADER } = require('../../utils/correlation-header')
const Stream = require('../../services/clients/stream.client')

const fetchTransactionCsvWithHeader = function fetchTransactionCsvWithHeader (req, res) {
  const accountId = req.account.gateway_account_id
  const filters = req.query
  const name = `GOVUK_Pay_${date.dateToDefaultFormat(new Date()).replace(' ', '_')}.csv`
  const correlationId = req.headers[CORRELATION_HEADER]

  if (req.account && req.account.payment_provider === 'stripe') {
    filters.feeHeaders = true
  }

  filters.motoHeader = req.account && req.account.allow_moto
  const url = transactionService.csvSearchUrl(filters, accountId)

  const timestampStreamStart = Date.now()
  const data = (chunk) => { res.write(chunk) }
  const complete = () => {
    transactionService.logCsvFileStreamComplete(timestampStreamStart, filters, [accountId], req.user, correlationId, false, req.account.type === 'live')
    res.end()
  }
  const error = () => renderErrorView(req, res, 'Unable to download list of transactions.')
  const client = new Stream(data, complete, error)

  res.setHeader('Content-disposition', `attachment; filename="${name}"`)
  res.setHeader('Content-Type', 'text/csv')

  client.request(url, correlationId)
}

module.exports = fetchTransactionCsvWithHeader
