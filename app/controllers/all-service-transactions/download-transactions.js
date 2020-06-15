'use strict'

const logger = require('../../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const date = require('../../utils/dates')
const transactionService = require('../../services/transaction_service')
const Stream = require('../../services/clients/stream_client')
const { CORRELATION_HEADER } = require('../../utils/correlation_header')
const { renderErrorView } = require('../../utils/response')
const permissions = require('../../utils/permissions')

module.exports = (req, res) => {
  const filters = req.query
  const correlationId = req.headers[CORRELATION_HEADER]
  const name = `GOVUK_Pay_${date.dateToDefaultFormat(new Date()).replace(' ', '_')}.csv`

  permissions.getLiveGatewayAccountsFor(req.user, 'transactions:read')
    .then((userPermittedAccountsSummary) => {
      if (!userPermittedAccountsSummary.gatewayAccountIds.length) {
        res.status(401).render('error', { message: 'You do not have any associated services with rights to view live transactions.' })
        return
      }
      filters.feeHeaders = userPermittedAccountsSummary.headers.shouldGetStripeHeaders
      filters.motoHeader = userPermittedAccountsSummary.headers.shouldGetMotoHeaders
      const url = transactionService.csvSearchUrl(filters, userPermittedAccountsSummary.gatewayAccountIds)

      const timestampStreamStart = Date.now()
      const data = (chunk) => { res.write(chunk) }
      const complete = () => {
        const timestampStreamEnd = Date.now()
        const logContext = {
          time_taken: timestampStreamEnd - timestampStreamStart,
          from_date: filters.fromDate,
          to_date: filters.toDate,
          gateway_payout_id: filters.gatewayPayoutId,
          payment_states: filters.payment_states,
          refund_states: filters.refund_stats,
          method: 'future'
        }
        logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId
        logContext[keys.GATEWAY_ACCOUNT_ID] = userPermittedAccountsSummary.gatewayAccountIds
        logContext[keys.CORRELATION_ID] = correlationId
        logger.info('Completed file stream', logContext)
        res.end()
      }
      const error = () => renderErrorView(req, res, 'Unable to download list of transactions.')
      const client = new Stream(data, complete, error)

      res.setHeader('Content-disposition', `attachment; filename="${name}"`)
      res.setHeader('Content-Type', 'text/csv')

      client.request(url, correlationId)
    })
    .catch(() => {
      renderErrorView(req, res, 'Unable to download list of transactions.')
    })
}
