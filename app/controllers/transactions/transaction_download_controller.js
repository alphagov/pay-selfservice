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

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const filters = req.query
  const name = `GOVUK_Pay_${date.dateToDefaultFormat(new Date()).replace(' ', '_')}.csv`
  const correlationId = req.headers[CORRELATION_HEADER]

  // @TODO(sfount) - columns are only set on a particular gateway account - CSV versioning/ dynamic CSVs should be properly designed
  const isStripeAccount = req.account && req.account.payment_provider === 'stripe'

  transactionService.searchAll(accountId, filters, correlationId)
    .then(json => {
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
      logger.debug('Sending csv attachment download -', { 'filename': name })
      res.setHeader('Content-disposition', 'attachment; filename="' + name + '"')
      res.setHeader('Content-Type', 'text/csv')
      res.send(csv)
    })
    .catch(err => renderErrorView(req, res, err ? 'Internal server error' : 'Unable to download list of transactions.'))
}
