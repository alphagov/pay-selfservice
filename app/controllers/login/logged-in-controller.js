'use strict'

// NPM dependencies
const logger = require('winston')
const _ = require('lodash')
const moment = require('moment-timezone')

// Custom dependencies
const response = require('../../utils/response').response
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER
const ConnectorClient = require('../../services/clients/connector_client').ConnectorClient
const auth = require('../../services/auth_service.js')
const connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = (req, res) => {
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  const gatewayAccountId = auth.getCurrentGatewayAccountId((req))
  let toDateTime = moment().tz('Europe/London').format() // Today is the default
  let daysAgo = 0
  let period = _.get(req, 'query.period', 'today')

  if (period === 'yesterday') {
    daysAgo = 1
  } else if (period === 'last-seven-days') {
    daysAgo = 8 // 7+1 because we count starting from yesterday
  } else if (period === 'last-thirty-days') {
    daysAgo = 31 // 30+1 because we count starting from yesterday
  }
  const fromDateTime = moment().tz('Europe/London').startOf('day').subtract(daysAgo, 'days').format()

  if (period !== 'today') {
    toDateTime = moment().tz('Europe/London').startOf('day').format()
  }

  logger.info(`[${correlationId}] successfully logged in`)

  connectorClient().getTransactionSummary({
    gatewayAccountId,
    correlationId,
    fromDateTime,
    toDateTime
  },
  (connectorData, connectorResponse) => {
    const activityResults = connectorResponse.body
    response(req, res, 'dashboard/index', {
      name: req.user.username,
      serviceId: req.service.externalId,
      activity: activityResults,
      fromDateTime,
      toDateTime,
      period
    })
  })
  .on('connectorError', (err, connectorResponse) => {
    logger.error(`[${correlationId}] Calling connector to get transactions summary failed -`, {
      service: 'connector',
      method: 'GET',
      status: connectorResponse.statusCode
    })
    response(req, res, 'dashboard/index', {
      name: req.user.username,
      serviceId: req.service.externalId,
      activityError: true
    })
  })
}
