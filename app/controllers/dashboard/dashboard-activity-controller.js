'use strict'

// NPM dependencies
const logger = require('winston')
const _ = require('lodash')
const moment = require('moment-timezone')

// Custom dependencies
const response = require('../../utils/response').response
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER
const ConnectorClient = require('../../services/clients/connector_client').ConnectorClient
const { isADirectDebitAccount } = require('../../services/clients/direct_debit_connector_client.js')
const auth = require('../../services/auth_service.js')
const connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL)
const datetime = require('../../utils/nunjucks-filters/datetime')
const NEW_CHARGE_STATUS_FEATURE_HEADER = 'NEW_CHARGE_STATUS_ENABLED'

module.exports = (req, res) => {
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  const gatewayAccountId = auth.getCurrentGatewayAccountId((req))
  const newChargeStatusEnabled = req.user.hasFeature(NEW_CHARGE_STATUS_FEATURE_HEADER)
  let toDateTime = moment().tz('Europe/London').format() // Today is the default
  let daysAgo = 0
  let period = _.get(req, 'query.period', 'today')

  if (period === 'yesterday') {
    daysAgo = 1
  } else if (period === 'previous-seven-days') {
    daysAgo = 8 // 7+1 because we count starting from yesterday
  } else if (period === 'previous-thirty-days') {
    daysAgo = 31 // 30+1 because we count starting from yesterday
  }
  const fromDateTime = moment().tz('Europe/London').startOf('day').subtract(daysAgo, 'days').format()

  if (period !== 'today') {
    toDateTime = moment().tz('Europe/London').startOf('day').format()
  }

  const transactionsPeriodString = `fromDate=${encodeURIComponent(datetime(fromDateTime, 'date'))}&fromTime=${encodeURIComponent(datetime(fromDateTime, 'time'))}&toDate=${encodeURIComponent(datetime(toDateTime, 'date'))}&toTime=${encodeURIComponent(datetime(toDateTime, 'time'))}`

  logger.info(`[${correlationId}] successfully logged in`)

  if (isADirectDebitAccount(gatewayAccountId)) {
    // todo implement transaction list for direct debit
    return response(req, res, 'dashboard/index', {
      name: req.user.username,
      serviceId: req.service.externalId,
      activityError: true,
      period
    })
  }
  connectorClient().getTransactionSummary({
    gatewayAccountId,
    correlationId,
    fromDateTime,
    toDateTime
  }, (connectorData, connectorResponse) => {
    const activityResults = connectorResponse.body
    response(req, res, 'dashboard/index', {
      name: req.user.username,
      serviceId: req.service.externalId,
      activity: activityResults,
      successfulTransactionsState: newChargeStatusEnabled ? 'payment-success' : 'success',
      fromDateTime,
      toDateTime,
      period,
      transactionsPeriodString
    })
  })
  .on('connectorError', (error, connectorResponse) => {
    const status = _.get(connectorResponse, 'statusCode', 404)
    logger.error(`[${correlationId}] Calling connector to get transactions summary failed -`, {
      service: 'connector',
      method: 'GET',
      status,
      error
    })
    res.status(status)
    response(req, res, 'dashboard/index', {
      name: req.user.username,
      serviceId: req.service.externalId,
      activityError: true,
      period
    })
  })
}
