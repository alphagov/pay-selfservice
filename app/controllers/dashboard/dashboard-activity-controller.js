'use strict'

// NPM dependencies
const logger = require('winston')
const _ = require('lodash')
const moment = require('moment-timezone')

// Custom dependencies
const response = require('../../utils/response').response
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER
const ConnectorClient = require('../../services/clients/connector_client').ConnectorClient
const {isADirectDebitAccount} = require('../../services/clients/direct_debit_connector_client.js')
const auth = require('../../services/auth_service.js')
const connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL)
const datetime = require('../../utils/nunjucks-filters/datetime')

module.exports = (req, res) => {
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  const gatewayAccountId = auth.getCurrentGatewayAccountId((req))
  let fromDateTime
  let toDateTime = moment().tz('Europe/London').format() // Today is the default
  let daysAgo = 0
  const period = _.get(req, 'query.period', 'today')

  if (period === 'yesterday') {
    daysAgo = 1
  } else if (period === 'previous-seven-days') {
    daysAgo = 8 // 7+1 because we count starting from yesterday
  } else if (period === 'previous-thirty-days') {
    daysAgo = 31 // 30+1 because we count starting from yesterday
  } else if (period === 'custom') {
    fromDateTime = _.get(req, 'query.fromDateTime', null)
    toDateTime = _.get(req, 'query.toDateTime', null)

    const validFromDateTime = fromDateTime && moment(fromDateTime).isValid()
    const validToDateTime = toDateTime && moment(toDateTime).isValid()
    const getCustomDateRangeDays = (fromDateTime, toDateTime) => moment(toDateTime).diff(moment(fromDateTime), 'days')

    if (!validFromDateTime || !validToDateTime || getCustomDateRangeDays(fromDateTime, toDateTime) > 31) {
      logger.error(`[${correlationId}] Invalid custom date range specified`)
      res.status(400)
      response(req, res, 'dashboard/index', {
        name: req.user.username,
        serviceId: req.service.externalId,
        activityError: true,
        period
      })
      return
    }
    fromDateTime = decodeURIComponent(fromDateTime)
    toDateTime = decodeURIComponent(toDateTime)
  }

  if (period !== 'custom') {
    fromDateTime = moment().tz('Europe/London').startOf('day').subtract(daysAgo, 'days').format()

    if (period !== 'today') {
      toDateTime = moment().tz('Europe/London').startOf('day').format()
    }
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
      successfulTransactionsState: 'payment-success',
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
