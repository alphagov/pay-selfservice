'use strict'

const transactionService = require('../../services/transaction.service')
const date = require('../../utils/dates')
const { renderErrorView } = require('../../utils/response')
const { CORRELATION_HEADER } = require('../../utils/correlation-header')
const Stream = require('../../services/clients/stream.client')
const enableFeeBreakDownForTestAccounts = process.env.ENABLE_FEE_BREAKDOWN_IN_CSV_FOR_STRIPE_TEST_ACCOUNTS === 'true'
const includeFeeBreakdownHeadersFromDate = process.env.INCLUDE_FEE_BREAKDOWN_HEADERS_IN_CSV_DATE || '1642982460'

const fetchTransactionCsvWithHeader = (req, res) => {
  const accountId = req.account.gateway_account_id
  const filters = req.query
  const name = `GOVUK_Pay_${date.dateToDefaultFormat(new Date()).replace(' ', '_')}.csv`
  const correlationId = req.headers[CORRELATION_HEADER]

  if (req.account && req.account.payment_provider === 'stripe') {
    filters.feeHeaders = true

    const includeFeeBreakdownHeaders = Math.round(Date.now() / 1000) >= includeFeeBreakdownHeadersFromDate
    filters.feeBreakdownHeaders = includeFeeBreakdownHeaders || (req.account.type === 'test' && enableFeeBreakDownForTestAccounts)
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
