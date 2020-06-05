'use strict'

// NPM dependencies
const _ = require('lodash')
const moment = require('moment-timezone')

// Custom dependencies
const logger = require('../../utils/logger')(__filename)
const response = require('../../utils/response').response
const CORRELATION_HEADER = require('../../utils/correlation_header').CORRELATION_HEADER
const LedgerClient = require('../../services/clients/ledger_client')
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
    const { fromDateTime, toDateTime } = getTransactionDateRange(period)

    const transactionsPeriodString = `fromDate=${encodeURIComponent(datetime(fromDateTime, 'date'))}&fromTime=${encodeURIComponent(datetime(fromDateTime, 'time'))}&toDate=${encodeURIComponent(datetime(toDateTime, 'date'))}&toTime=${encodeURIComponent(datetime(toDateTime, 'time'))}`

    logger.info(`[${correlationId}] successfully logged in`)

    if (isADirectDebitAccount(gatewayAccountId)) {
      // todo implement transaction list for direct debit
      return response(req, res, 'dashboard/index', Object.assign(model, {
        activityError: true
      }))
    }

    LedgerClient.transactionSummary(gatewayAccountId, fromDateTime, toDateTime, { correlationId: correlationId })
      .then(result => {
        response(req, res, 'dashboard/index', Object.assign(model, {
          activity: result,
          successfulTransactionsState: 'payment-success',
          fromDateTime,
          toDateTime,
          transactionsPeriodString
        }))
      })
      .catch((error, ledgerResponse) => {
        const status = _.get(ledgerResponse, 'statusCode', 404)
        logger.error(`[${correlationId}] Calling ledger to get transactions summary failed`, {
          service: 'ledger',
          method: 'GET',
          status,
          error
        })
        res.status(status)
        response(req, res, 'dashboard/index', Object.assign(model, {
          activityError: true
        }))
      })
  } catch (err) {
    logger.error(`[${correlationId}] ${err.message}`, {
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

function getTransactionDateRange (period) {
  const toDateTime = period === 'today'
    ? moment().tz('Europe/London').format()
    : moment().tz('Europe/London').startOf('day').format()
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
  }

  const fromDateTime = moment().tz('Europe/London').startOf('day').subtract(daysAgo, 'days').format()

  return { fromDateTime, toDateTime }
}
