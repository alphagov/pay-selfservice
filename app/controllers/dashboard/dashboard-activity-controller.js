'use strict'

// NPM dependencies
const _ = require('lodash')
const moment = require('moment-timezone')
const AWSXRay = require('aws-xray-sdk')
const getNamespace = require('continuation-local-storage').getNamespace

// Custom dependencies
const logger = require('../../utils/logger')(__filename)
const response = require('../../utils/response').response
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER
const ConnectorClient = require('../../services/clients/connector_client').ConnectorClient
const { isADirectDebitAccount } = require('../../services/clients/direct_debit_connector_client.js')
const auth = require('../../services/auth_service.js')
const { datetime } = require('@govuk-pay/pay-js-commons').nunjucksFilters
const {
  NOT_STARTED,
  ENTERED_ORGANISATION_NAME,
  ENTERED_ORGANISATION_ADDRESS,
  CHOSEN_PSP_STRIPE,
  CHOSEN_PSP_WORLDPAY,
  CHOSEN_PSP_SMARTPAY,
  CHOSEN_PSP_EPDQ,
  TERMS_AGREED_STRIPE,
  TERMS_AGREED_WORLDPAY,
  TERMS_AGREED_SMARTPAY,
  TERMS_AGREED_EPDQ,
  LIVE,
  DENIED
} = require('../../models/go-live-stage')

const connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL)
const getTimespanDays = (fromDateTime, toDateTime) => moment(toDateTime).diff(moment(fromDateTime), 'days')

// Constants
const clsXrayConfig = require('../../../config/xray-cls')

const links = {
  manageService: 0,
  demoPayment: 1,
  testPaymentLink: 2,
  directDebitPaymentFlow: 3,
  paymentLinks: 4,
  goLive: 5
}

const goLiveStartedStages = [
  ENTERED_ORGANISATION_NAME,
  ENTERED_ORGANISATION_ADDRESS,
  CHOSEN_PSP_STRIPE,
  CHOSEN_PSP_EPDQ,
  CHOSEN_PSP_SMARTPAY,
  CHOSEN_PSP_WORLDPAY
]

const goLiveRequestedStages = [
  TERMS_AGREED_STRIPE,
  TERMS_AGREED_EPDQ,
  TERMS_AGREED_SMARTPAY,
  TERMS_AGREED_WORLDPAY
]

const goLiveLinkNotDisplayedStages = [
  LIVE,
  DENIED
]

const getLinksToDisplay = function getLinksToDisplay (service, account, user) {
  const linksToDisplay = [links.manageService]

  if (account.payment_provider === 'sandbox') {
    linksToDisplay.push(links.demoPayment)
    linksToDisplay.push(links.testPaymentLink)
  } else if (account.paymentMethod === 'direct debit') {
    linksToDisplay.push(links.directDebitPaymentFlow)
  } else {
    linksToDisplay.push(links.paymentLinks)
  }

  if (displayGoLiveLink(service, account, user)) {
    linksToDisplay.push(links.goLive)
  }

  return linksToDisplay
}

const displayGoLiveLink = (service, account, user) => {
  return account.type === 'test' &&
    (!goLiveLinkNotDisplayedStages.includes(service.currentGoLiveStage) &&
      user.hasPermission(service.externalId, 'go-live-stage:read'))
}

module.exports = (req, res) => {
  const gatewayAccountId = auth.getCurrentGatewayAccountId((req))

  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  const period = _.get(req, 'query.period', 'today')

  // Get any custom date ranges
  const customFomDateTime = _.get(req, 'query.fromDateTime', null)
  const customToDateTime = _.get(req, 'query.toDateTime', null)

  const linksToDisplay = getLinksToDisplay(req.service, req.account, req.user)
  const model = {
    name: req.user.username,
    serviceId: req.service.externalId,
    period,
    links,
    linksToDisplay,
    goLiveNotStarted: req.service.currentGoLiveStage === NOT_STARTED,
    goLiveStarted: goLiveStartedStages.includes(req.service.currentGoLiveStage),
    goLiveRequested: goLiveRequestedStages.includes(req.service.currentGoLiveStage),
    account: req.account
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
