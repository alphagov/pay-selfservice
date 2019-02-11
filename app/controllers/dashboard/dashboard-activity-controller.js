'use strict'

// NPM dependencies
const logger = require('winston')
const _ = require('lodash')
const moment = require('moment-timezone')
const AWSXRay = require('aws-xray-sdk')
const getNamespace = require('continuation-local-storage').getNamespace

// Custom dependencies
const response = require('../../utils/response').response
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER
const ConnectorClient = require('../../services/clients/connector_client').ConnectorClient
const { isADirectDebitAccount } = require('../../services/clients/direct_debit_connector_client.js')
const auth = require('../../services/auth_service.js')
const { datetime } = require('@govuk-pay/pay-js-commons').nunjucksFilters
const goLiveStage = require('../../models/go-live-stage')

const connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL)
const getTimespanDays = (fromDateTime, toDateTime) => moment(toDateTime).diff(moment(fromDateTime), 'days')

// Constants
const clsXrayConfig = require('../../../config/xray-cls')

const displayGoLiveLink = (service, account, user) => {
  return account.type === 'test' &&
    (account.paymentMethod === 'direct debit' ||
      (service.currentGoLiveStage !== goLiveStage.LIVE &&
        service.currentGoLiveStage !== goLiveStage.DENIED &&
        user.hasPermission(service.externalId, 'go-live-stage:read')))
}

const getLinksToDisplay = (service, account, user) => {
  const links = ['manageService']

  if (account.payment_provider === 'sandbox') {
    links.push('demoPayment')
    links.push('testPaymentLink')
  } else if (account.paymentMethod === 'direct debit') {
    links.push('directDebitPaymentFlow')
  } else {
    links.push('paymentLinks')
  }

  if (displayGoLiveLink(service, account, user)) {
    links.push('goLive')
  }

  return links
}

/**
 * Gets an array of the css classes to be applied to the link boxes on the dashboard in the order they are displayed in.
 * @param numberOfLinks the number of links that will be displayed
 * @returns {Array}
 */
const getLinkBoxClasses = (numberOfLinks) => {
  const columnClass = numberOfLinks % 3 === 0 ? 'flex-grid--column-third' : 'flex-grid--column-half'

  const divisor = numberOfLinks % 3 === 0 ? 3 : 2
  const finalRowStart = numberOfLinks - divisor

  const classes = []
  for (let i = 0; i < numberOfLinks; i++) {
    let linkBoxClass = columnClass
    // if the link isn't on the final row, apply a bottom border
    if (i < finalRowStart) {
      linkBoxClass += ' border-bottom'
    }

    classes.push(linkBoxClass)
  }

  return classes
}

module.exports = (req, res) => {
  const gatewayAccountId = auth.getCurrentGatewayAccountId((req))

  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  const period = _.get(req, 'query.period', 'today')

  // Get any custom date ranges
  const customFomDateTime = _.get(req, 'query.fromDateTime', null)
  const customToDateTime = _.get(req, 'query.toDateTime', null)

  const links = getLinksToDisplay(req.service, req.account, req.user)
  const model = {
    name: req.user.username,
    serviceId: req.service.externalId,
    period,
    goLiveStage,
    links,
    linkBoxClasses: getLinkBoxClasses(links.length)
  }

  try {
    const { fromDateTime, toDateTime } = getTransactionDateRange(period, {
      fromDateTime: customFomDateTime,
      toDateTime: customToDateTime
    })

    const transactionsPeriodString = `fromDate=${encodeURIComponent(datetime(fromDateTime, 'date'))}&fromTime=${encodeURIComponent(datetime(fromDateTime, 'time'))}&toDate=${encodeURIComponent(datetime(toDateTime, 'date'))}&toTime=${encodeURIComponent(datetime(toDateTime, 'time'))}`

    logger.info(`[${correlationId}] successfully logged in`)

    if (isADirectDebitAccount(gatewayAccountId)) {
      // todo implement transaction list for direct debit
      return response(req, res, 'dashboard/index', Object.assign(model, {
        activityError: true
      }))
    }

    const namespace = getNamespace(clsXrayConfig.nameSpaceName)
    const clsSegment = namespace.get(clsXrayConfig.segmentKeyName)

    AWSXRay.captureAsyncFunc('connectorClient_getTransactionSummary', function (subsegment) {
      connectorClient().getTransactionSummary({
        gatewayAccountId,
        correlationId,
        fromDateTime,
        toDateTime
      }, (connectorData, connectorResponse) => {
        subsegment.close()
        const activityResults = connectorResponse.body
        response(req, res, 'dashboard/index', Object.assign(model, {
          activity: activityResults,
          successfulTransactionsState: 'payment-success',
          fromDateTime,
          toDateTime,
          transactionsPeriodString
        }))
      }, subsegment)
        .on('connectorError', (error, connectorResponse) => {
          subsegment.close(error)
          const status = _.get(connectorResponse, 'statusCode', 404)
          logger.error(`[${correlationId}] Calling connector to get transactions summary failed -`, {
            service: 'connector',
            method: 'GET',
            status,
            error
          })
          res.status(status)
          response(req, res, 'dashboard/index', Object.assign(model, {
            activityError: true
          }))
        })
    }, clsSegment)
  } catch (err) {
    logger.error(`[${correlationId}] ${err.message} -`, {
      service: 'frontend',
      method: 'GET',
      error: err,
      status: err.status
    })
    res.status(err.status)
    response(req, res, 'dashboard/index', Object.assign(model, {
      activityError: true
    }))
  }
}

function getTransactionDateRange (period, customRange) {
  let fromDateTime
  let toDateTime = moment().tz('Europe/London').format() // Today is the default
  let daysAgo = 0

  switch (period) {
    case 'yesterday':
      daysAgo = 1
      break
    case 'previous-seven-days':
      daysAgo = 8 // 7+1 because we count starting from yesterday
      break
    case 'previous-thirty-days':
      daysAgo = 31 // 30+1 because we count starting from yesterday
      break
    case 'custom':
      const validFromDateTime = customRange.fromDateTime && moment(customRange.fromDateTime).isValid()
      const validToDateTime = customRange.toDateTime && moment(customRange.toDateTime).isValid()
      if (!validFromDateTime || !validToDateTime || getTimespanDays(customRange.fromDateTime, customRange.toDateTime) > 31) {
        let customRangeErr = new Error('Invalid custom date range specified')
        customRangeErr.status = 400
        throw customRangeErr
      }
      fromDateTime = decodeURIComponent(customRange.fromDateTime)
      toDateTime = decodeURIComponent(customRange.toDateTime)
      break
  }

  if (period !== 'custom') {
    fromDateTime = moment().tz('Europe/London').startOf('day').subtract(daysAgo, 'days').format()

    if (period !== 'today') {
      toDateTime = moment().tz('Europe/London').startOf('day').format()
    }
  }

  return { fromDateTime, toDateTime }
}
