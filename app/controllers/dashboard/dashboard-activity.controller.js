'use strict'

const _ = require('lodash')
const moment = require('moment-timezone')

const logger = require('../../utils/logger')(__filename)
const response = require('../../utils/response').response
const CORRELATION_HEADER = require('../../utils/correlation-header').CORRELATION_HEADER
const LedgerClient = require('../../services/clients/ledger.client')
const { isADirectDebitAccount } = require('../../services/clients/direct-debit-connector.client.js')
const { ConnectorClient } = require('../../services/clients/connector.client.js')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const auth = require('../../services/auth.service.js')
const { retrieveAccountDetails } = require('../../services/clients/stripe/stripe.client')
const { datetime } = require('@govuk-pay/pay-js-commons').nunjucksFilters
const {
  NOT_STARTED,
  ENTERED_ORGANISATION_NAME,
  ENTERED_ORGANISATION_ADDRESS,
  CHOSEN_PSP_STRIPE,
  CHOSEN_PSP_WORLDPAY,
  CHOSEN_PSP_SMARTPAY,
  CHOSEN_PSP_EPDQ,
  CHOSEN_PSP_GOV_BANKING_WORLDPAY,
  TERMS_AGREED_STRIPE,
  TERMS_AGREED_WORLDPAY,
  TERMS_AGREED_SMARTPAY,
  TERMS_AGREED_EPDQ,
  TERMS_AGREED_GOV_BANKING_WORLDPAY,
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
  CHOSEN_PSP_WORLDPAY,
  CHOSEN_PSP_GOV_BANKING_WORLDPAY
]

const goLiveRequestedStages = [
  TERMS_AGREED_STRIPE,
  TERMS_AGREED_EPDQ,
  TERMS_AGREED_SMARTPAY,
  TERMS_AGREED_WORLDPAY,
  TERMS_AGREED_GOV_BANKING_WORLDPAY
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

module.exports = async (req, res) => {
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
    gatewayAccount: req.account
  }

  if (req.account.payment_provider === 'stripe') {
    model.stripeAccount = await getStripeAccountDetails(req.account.gateway_account_id, req.correlationId)
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

    try {
      const result = await LedgerClient.transactionSummary(gatewayAccountId, fromDateTime, toDateTime, { correlationId: correlationId })
      response(req, res, 'dashboard/index', Object.assign(model, {
        activity: result,
        fromDateTime,
        toDateTime,
        transactionsPeriodString
      }))
    } catch (error) {
      const status = _.get(error.message, 'statusCode', 404)
      logger.error(`[${correlationId}] Calling ledger to get transactions summary failed`, {
        service: 'ledger',
        method: 'GET',
        status,
        error: error.errorCode
      })
      res.status(status)
      response(req, res, 'dashboard/index', Object.assign(model, {
        activityError: true
      }))
    }
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

async function getStripeAccountDetails (gatewayAccountId, correlationId) {
  try {
    const stripeResponse = await connector.getStripeAccount(gatewayAccountId, correlationId)
    const { stripeAccountId } = stripeResponse

    try {
      const fullStripeAccountDetails = await retrieveAccountDetails(stripeAccountId)

      const formattedStripeAccount = {
        charges_enabled: fullStripeAccountDetails.charges_enabled
      }

      if (fullStripeAccountDetails.requirements.current_deadline) {
        formattedStripeAccount.requirements = {
          current_deadline: moment.unix(fullStripeAccountDetails.requirements.current_deadline).format('D MMMM YYYY')
        }
      }

      return formattedStripeAccount
    } catch (e) {
      logger.error(`[${correlationId}] Calling Stripe failed to get Stripe account details for: ${stripeAccountId}`)
    }
  } catch (e) {
    logger.error(`[${correlationId}] Calling Connector failed to get Stripe account id for: ${gatewayAccountId}`)
  }

  return null
}
