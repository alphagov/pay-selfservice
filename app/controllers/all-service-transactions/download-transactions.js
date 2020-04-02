'use strict'

const logger = require('../../utils/logger')(__filename)
const date = require('../../utils/dates')
const transactionService = require('../../services/transaction_service')
const Stream = require('../../services/clients/stream_client')
const { CORRELATION_HEADER } = require('../../utils/correlation_header')
const { renderErrorView } = require('../../utils/response')
const { liveUserServicesGatewayAccounts } = require('./../../utils/valid_account_id')

module.exports = (req, res) => {
  const filters = req.query
  const correlationId = req.headers[CORRELATION_HEADER]
  const name = `GOVUK_Pay_${date.dateToDefaultFormat(new Date()).replace(' ', '_')}.csv`

  const accountIdsUsersHasPermissionsFor = liveUserServicesGatewayAccounts(req.user)
  const url = transactionService.csvSearchUrl({ ...filters, live: true }, accountIdsUsersHasPermissionsFor)

  const timestampStreamStart = Date.now()
  const data = (chunk) => { res.write(chunk) }
  const complete = () => {
    const timestampStreamEnd = Date.now()
    logger.info('Completed file stream', {
      gateway_account_id: accountIdsUsersHasPermissionsFor,
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
