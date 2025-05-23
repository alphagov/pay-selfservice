'use strict'

const _ = require('lodash')
const moment = require('moment-timezone')

const logger = require('../../utils/logger')(__filename)
const response = require('../../utils/response').response
const { getCurrentCredential, getSwitchingCredential } = require('../../utils/credentials')
const LedgerClient = require('../../services/clients/ledger.client')
const ProductsClient = require('../../services/clients/products.client.js')
const { ConnectorClient } = require('../../services/clients/connector.client.js')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const { retrieveAccountDetails } = require('../../services/clients/stripe/stripe.client')
const { datetime } = require('@govuk-pay/pay-js-commons').nunjucksFilters

const {
  NOT_STARTED,
  ENTERED_ORGANISATION_NAME,
  ENTERED_ORGANISATION_ADDRESS,
  CHOSEN_PSP_STRIPE,
  CHOSEN_PSP_GOV_BANKING_WORLDPAY,
  GOV_BANKING_MOTO_OPTION_COMPLETED,
  TERMS_AGREED_STRIPE,
  TERMS_AGREED_GOV_BANKING_WORLDPAY,
  LIVE,
  DENIED
} = require('@models/constants/go-live-stage')
const pspTestAccountStage = require('@models/constants/psp-test-account-stage')
const { WORLDPAY, STRIPE } = require('@models/constants/payment-providers')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const formatAccountPathsFor = require('@utils/format-account-paths-for')

const links = {
  demoPayment: 0,
  testPaymentLink: 1,
  directDebitPaymentFlow: 2,
  paymentLinks: 3,
  requestPspTestAccount: 4,
  goLive: 5,
  telephonePaymentLink: 6
}

const goLiveStartedStages = [
  ENTERED_ORGANISATION_NAME,
  ENTERED_ORGANISATION_ADDRESS,
  CHOSEN_PSP_STRIPE,
  CHOSEN_PSP_GOV_BANKING_WORLDPAY,
  GOV_BANKING_MOTO_OPTION_COMPLETED
]

const goLiveRequestedStages = [
  TERMS_AGREED_STRIPE,
  TERMS_AGREED_GOV_BANKING_WORLDPAY
]

const goLiveLinkNotDisplayedStages = [
  LIVE,
  DENIED
]

const getLinksToDisplay = function getLinksToDisplay (service, account, user, telephonePaymentLink) {
  const linksToDisplay = []

  if (displayDemoAndTestPaymentLinks(account)) {
    linksToDisplay.push(links.demoPayment)
    linksToDisplay.push(links.testPaymentLink)
  } else {
    linksToDisplay.push(links.paymentLinks)
  }

  if (displayGoLiveLink(service, account, user)) {
    linksToDisplay.push(links.goLive)
  }

  if (displayRequestTestStripeAccountLink(service, account, user)) {
    linksToDisplay.push(links.requestPspTestAccount)
  }

  if (telephonePaymentLink) {
    linksToDisplay.push(links.telephonePaymentLink)
  }

  return linksToDisplay
}

function displayDemoAndTestPaymentLinks (account) {
  return account.payment_provider === 'sandbox' ||
    (account.payment_provider === 'stripe' && account.type === 'test')
}

const displayGoLiveLink = (service, account, user) => {
  return account.type === 'test' &&
    (!goLiveLinkNotDisplayedStages.includes(service.currentGoLiveStage) &&
      user.hasPermission(service.externalId, 'go-live-stage:read'))
}

const displayRequestTestStripeAccountLink = (service, account, user) => {
  // Since 29/08/2024, services that identified as local govt were automatically allocated Stripe test accounts
  // So services created after that date don't need a link to create a Stripe test account
  // this change was deployed in selfservice PR #4256 at approx. 10:08 UTC so this time is used as the cutoff
  const serviceCreatedBeforeOrgTypeCaptured = new Date(service.createdDate) <= new Date('2024-08-29T10:08:00Z')
  return account.payment_provider === 'sandbox' && service.currentGoLiveStage !== LIVE && serviceCreatedBeforeOrgTypeCaptured &&
    service.currentPspTestAccountStage !== pspTestAccountStage.CREATED &&
    user.hasPermission(service.externalId, 'psp-test-account-stage:update')
}

async function isWorldpayTestService (service, account) {
  return service.gatewayAccountIds.length === 1 &&
    parseInt(account.gateway_account_id) === parseInt(service.gatewayAccountIds[0]) &&
    account.type === 'test' &&
    account.payment_provider === WORLDPAY
}

const getConfigurePSPAccountLink = (req) => {
  const credential = getCurrentCredential(req.account)
  const paymentProvider = credential?.payment_provider

  if (![WORLDPAY, STRIPE].includes(paymentProvider)) {
    return
  }

  const simplifiedPaths = {
    [WORLDPAY]: paths.simplifiedAccount.settings.worldpayDetails.index,
    [STRIPE]: paths.simplifiedAccount.settings.stripeDetails.index
  }

  return formatSimplifiedAccountPathsFor(
    simplifiedPaths[paymentProvider],
    req.service.externalId,
    req.account.type
  )
}

module.exports = async (req, res) => {
  const gatewayAccountId = req.account.gateway_account_id
  const messages = res.locals.flash.messages
  const period = _.get(req, 'query.period', 'today')
  const telephonePaymentLink = await getTelephonePaymentLink(req.user, req.service, gatewayAccountId)
  const worldpayTestService = await isWorldpayTestService(req.service, req.account)
  const linksToDisplay = getLinksToDisplay(req.service, req.account, req.user, telephonePaymentLink)
  const model = {
    serviceId: req.service.externalId,
    period,
    links,
    linksToDisplay,
    telephonePaymentLink,
    requestedStripeTestAccount: req.service.currentPspTestAccountStage === pspTestAccountStage.REQUEST_SUBMITTED && req.account.payment_provider === 'sandbox',
    goLiveNotStarted: req.service.currentGoLiveStage === NOT_STARTED,
    goLiveStarted: goLiveStartedStages.includes(req.service.currentGoLiveStage),
    goLiveRequested: goLiveRequestedStages.includes(req.service.currentGoLiveStage),
    gatewayAccount: req.account,
    enableStripeOnboardingTaskList: process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST === 'true',
    isWorldpayTestService: worldpayTestService,
    paymentProvider: req.account.payment_provider,
    configurePSPAccountLink: getConfigurePSPAccountLink(req)
  }

  if (req.account.payment_provider === 'stripe' && req.account.type === 'live') {
    model.stripeAccount = await getStripeAccountDetails(req.account.gateway_account_id)
  }

  try {
    let targetCredential = {}
    const activeCredential = getCurrentCredential(req.account)
    try {
      targetCredential = getSwitchingCredential(req.account)
    } catch (notSwitchingError) {
      // it's valid to not be switching on the dashboard, no op here
    }
    const { fromDateTimeInUTC, toDateTimeInUTC } = getTransactionDateRangeInUTC(period)

    const transactionsPeriodString = `fromDate=${encodeURIComponent(datetime(fromDateTimeInUTC, 'date'))}&fromTime=${encodeURIComponent(datetime(fromDateTimeInUTC, 'time'))}&toDate=${encodeURIComponent(datetime(toDateTimeInUTC, 'date'))}&toTime=${encodeURIComponent(datetime(toDateTimeInUTC, 'time'))}`

    try {
      const result = await LedgerClient.transactionSummary(gatewayAccountId, fromDateTimeInUTC, toDateTimeInUTC)
      response(req, res, 'dashboard/index', Object.assign(model, {
        activity: result,
        messages,
        fromDateTime: fromDateTimeInUTC,
        toDateTime: toDateTimeInUTC,
        transactionsPeriodString,
        targetCredential,
        activeCredential,
        worldpayAccountAndSetupIncomplete: (req.account.payment_provider === 'worldpay' && activeCredential && activeCredential.state === 'CREATED'),
        showStripeCreatedPanelSuccess: res.locals.flash && res.locals.flash.requestStripeTestAccount &&
          res.locals.flash.requestStripeTestAccount[0] === 'success',
        apiKeysLink: `/account/${encodeURIComponent(req.account.external_id)}/api-keys`
      }))
    } catch (error) {
      const status = _.get(error.message, 'statusCode', 404)
      logger.error('Calling ledger to get transactions summary failed', {
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
    logger.error(`Error getting transaction summary: ${err.message}`, {
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

function getTransactionDateRangeInUTC (period) {
  const toDateTimeInUTC = period === 'today'
    ? moment().tz('Europe/London').toISOString()
    : moment().tz('Europe/London').startOf('day').toISOString()
  let daysAgo = 0

  switch (period) {
    case 'yesterday':
      daysAgo = 1
      break
    case 'previous-seven-days':
      daysAgo = 7
      break
    case 'previous-thirty-days':
      daysAgo = 30
      break
  }

  const fromDateTimeInUTC = moment().tz('Europe/London').startOf('day').subtract(daysAgo, 'days').toISOString()

  return { fromDateTimeInUTC, toDateTimeInUTC }
}

async function getStripeAccountDetails (gatewayAccountId) {
  try {
    const stripeResponse = await connector.getStripeAccount(gatewayAccountId)
    const { stripeAccountId } = stripeResponse

    try {
      const fullStripeAccountDetails = await retrieveAccountDetails(stripeAccountId)
      const hasLegacyPaymentsCapability = fullStripeAccountDetails.capabilities && fullStripeAccountDetails.capabilities.legacy_payments !== undefined

      const formattedStripeAccount = {
        charges_enabled: fullStripeAccountDetails.charges_enabled,
        has_legacy_payments_capability: hasLegacyPaymentsCapability
      }

      if (fullStripeAccountDetails.requirements.current_deadline) {
        formattedStripeAccount.requirements = {
          current_deadline: moment.unix(fullStripeAccountDetails.requirements.current_deadline).format('D MMMM YYYY')
        }
      }

      return formattedStripeAccount
    } catch (e) {
      logger.error(`Calling Stripe failed to get Stripe account details for: ${stripeAccountId}`)
    }
  } catch (e) {
    logger.error(`Calling Connector failed to get Stripe account id for: ${gatewayAccountId}`)
  }

  return null
}

async function getTelephonePaymentLink (user, service, gatewayAccountId) {
  if (service.agentInitiatedMotoEnabled && user.hasPermission(service.externalId, 'agent-initiated-moto:create')) {
    const telephonePaymentLinks = await getTelephonePaymentLinks(gatewayAccountId)
    if (telephonePaymentLinks.length >= 1) {
      return telephonePaymentLinks[0].links.pay.href
    }
  }
  return null
}

async function getTelephonePaymentLinks (gatewayAccountId) {
  try {
    return await ProductsClient.product.getByGatewayAccountIdAndType(gatewayAccountId, 'AGENT_INITIATED_MOTO')
  } catch (e) {
    logger.error(`Calling products failed for ${gatewayAccountId}`)
  }
  return []
}
