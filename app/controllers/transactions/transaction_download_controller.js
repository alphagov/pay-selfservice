'use strict'

// NPM Dependencies
const logger = require('winston')
const lodash = require('lodash')

// Local Dependencies
const transactionService = require('../../services/transaction_service')
const jsonToCsv = require('../../utils/json_to_csv.js')
const auth = require('../../services/auth_service.js')
const date = require('../../utils/dates.js')
const {renderErrorView} = require('../../utils/response.js')
const {CORRELATION_HEADER} = require('../../utils/correlation_header.js')
const userService = require('../../services/user_service')

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const filters = req.query
  const name = `GOVUK_Pay_${date.dateToDefaultFormat(new Date()).replace(' ', '_')}.csv`
  const correlationId = req.headers[CORRELATION_HEADER]
  transactionService.searchAll(accountId, filters, correlationId)
    .then(json => {
      let userIds = json.results
        .filter(res => res.transaction_type === 'refund')
        .map(res => res.refund_summary.user_external_id)
      userIds = lodash.uniq(userIds)
      if (userIds.length === 0) {
        return jsonToCsv(json.results)
      } else {
        return userService.findMultipleByExternalIds(userIds, correlationId)
          .then(users => {
            const usersMap = userIds.reduce((map, userId, index) => {
              map[userId] = users[index].username
              return map
            }, {})
            const results = json.results
              .map(res => {
                if (res.transaction_type === 'refund') {
                  res.refund_summary.user_external_id = usersMap[res.refund_summary.user_external_id]
                }
                return res
              })
            return jsonToCsv(results)
          })
      }
    })
    .then(csv => {
      logger.debug('Sending csv attachment download -', {'filename': name})
      res.setHeader('Content-disposition', 'attachment; filename="' + name + '"')
      res.setHeader('Content-Type', 'text/csv')
      res.send(csv)
    })
    .catch(err => renderErrorView(req, res, err ? 'Internal server error' : 'Unable to download list of transactions.'))
}
