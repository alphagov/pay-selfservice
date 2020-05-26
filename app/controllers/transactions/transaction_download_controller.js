'use strict'
const logger = require('../../utils/logger')(__filename)
const transactionService = require('../../services/transaction_service')
const auth = require('../../services/auth_service')
const date = require('../../utils/dates')
const { renderErrorView } = require('../../utils/response')
const { CORRELATION_HEADER } = require('../../utils/correlation_header')
const Stream = require('../../services/clients/stream_client')

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
    const timestampStreamEnd = Date.now()
    logger.info('Completed file stream', {
      gateway_account_id: accountId,
      time_taken: timestampStreamEnd - timestampStreamStart,
      from_date: filters.fromDate,
      to_date: filters.toDate,
      payment_states: filters.payment_states,
      refund_states: filters.refund_stats,
      x_request_id: correlationId,
      method: 'future'
    })
    res.end()
  }
  const error = () => renderErrorView(req, res, 'Unable to download list of transactions.')
  const client = new Stream(data, complete, error)

  res.setHeader('Content-disposition', `attachment; filename="${name}"`)
  res.setHeader('Content-Type', 'text/csv')

  client.request(url, correlationId)
}

module.exports = fetchTransactionCsvWithHeader
