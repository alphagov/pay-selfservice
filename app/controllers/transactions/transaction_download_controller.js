'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local Dependencies
const logger = require('../../utils/logger')(__filename)
const transactionService = require('../../services/transaction_service')
const jsonToCsv = require('../../utils/json_to_csv')
const auth = require('../../services/auth_service')
const date = require('../../utils/dates')
const { renderErrorView } = require('../../utils/response')
const { CORRELATION_HEADER } = require('../../utils/correlation_header')
const userService = require('../../services/user_service')
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

const fetchTransactionCsvWithoutHeader = function fetchTransactionCsvWithoutHeader (req, res) {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const filters = req.query
  const name = `GOVUK_Pay_${date.dateToDefaultFormat(new Date()).replace(' ', '_')}.csv`
  const correlationId = req.headers[CORRELATION_HEADER]

  let timestampRequestReceived, timestampProcessingStarted, timestampProcessingComplete
  let transactionRowsSize
  timestampRequestReceived = Date.now()

  // @TODO(sfount) - columns are only set on a particular gateway account - CSV versioning/ dynamic CSVs should be properly designed
  const isStripeAccount = req.account && req.account.payment_provider === 'stripe'

  transactionService.searchAll(accountId, filters, correlationId)
    .then(json => {
      timestampProcessingStarted = Date.now()
      transactionRowsSize = json.results && json.results.length
      let refundTransactionUserIds = json.results
        .filter(res => res.transaction_type && res.transaction_type.toLowerCase() === 'refund')
        .map(res => res.refund_summary.user_external_id)
        .filter(userId => userId) // we call filter because we want to filter out all "falsy" values
      refundTransactionUserIds = lodash.uniq(refundTransactionUserIds)
      if (refundTransactionUserIds.length === 0) { // if there are no refunds found
        return jsonToCsv(json.results, isStripeAccount)
      } else {
        return userService.findMultipleByExternalIds(refundTransactionUserIds, correlationId)
          .then(users => {
            const userUsernameMap = refundTransactionUserIds.reduce((map, userId) => {
              map[userId] = users.find(user => {
                return user.externalId === userId
              }).username
              return map
            }, {})
            const results = json.results
              .map(transactionRow => {
                if (transactionRow.transaction_type && transactionRow.transaction_type.toLowerCase() === 'refund') {
                  if (transactionRow.refund_summary.user_external_id) {
                    transactionRow.refund_summary.user_username = userUsernameMap[transactionRow.refund_summary.user_external_id]
                  }
                }
                return transactionRow
              })
            return jsonToCsv(results, isStripeAccount)
          })
      }
    })
    .then(csv => {
      timestampProcessingComplete = Date.now()
      logger.debug('Sending csv attachment download', { 'filename': name })
      logger.info('Transaction CSV download', {
        gateway_account_id: accountId,
        from_date: filters.fromDate,
        to_date: filters.toDate,
        payment_states: filters.payment_states,
        refund_states: filters.refund_stats,
        csv_rows_length: transactionRowsSize,
        fetch_duration: timestampProcessingStarted - timestampRequestReceived,
        process_duration: timestampProcessingComplete - timestampProcessingStarted,
        method: 'legacy'
      })
      res.setHeader('Content-disposition', 'attachment; filename="' + name + '"')
      res.setHeader('Content-Type', 'text/csv')
      res.send(csv)
    })
    .catch(err => renderErrorView(req, res, err ? 'Internal server error' : 'Unable to download list of transactions.'))
}

const fetchTransactions = function (req, res) {
  if (process.env.USE_LEDGER_BACKEND_CSV === 'true') {
    return fetchTransactionCsvWithHeader(req, res)
  } else {
    return fetchTransactionCsvWithoutHeader(req, res)
  }
}

module.exports = fetchTransactions
