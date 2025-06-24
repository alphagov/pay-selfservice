const { response } = require('@utils/response')
const { getStripeAccountOnboardingDetails } = require('@services/stripe-details.service')
const paths = require('@root/paths')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const StripeTasks = require('@models/StripeTasks.class')
const PaymentProviders = require('@models/constants/payment-providers')
const formatServiceAndAccountPathsFor = require('@utils/simplified-account/format/format-service-and-account-paths-for')

async function getAccountDetails (req, res) {
  const account = req.account
  const service = req.service
  getStripeAccountOnboardingDetails(service, account)
    .then((result) => {
      res.json({
        ...result
      })
    })
}

async function get (req, res) {
  const javascriptUnavailable = req.query.noscript === 'true'
  const account = req.account
  const service = req.service
  const gatewayAccountStripeProgress = req.gatewayAccountStripeProgress
  const stripeTasks = new StripeTasks(gatewayAccountStripeProgress, account, service.externalId)
  let answers = {}
  // load account onboarding details synchronously if javascript is unavailable
  if (!stripeTasks.hasIncompleteTasks() && javascriptUnavailable) {
    const stripeAccountOnboardingDetails = await getStripeAccountOnboardingDetails(service, account)
    answers = {
      ...stripeAccountOnboardingDetails
    }
  }
  return response(req, res, 'simplified-account/settings/stripe-details/index', {
    javascriptUnavailable,
    accountDetailsPath: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.accountDetails, service.externalId, account.type),
    messages: res.locals?.flash?.messages ?? [],
    tasks: stripeTasks.tasks,
    incompleteTasks: stripeTasks.hasIncompleteTasks(),
    serviceExternalId: service.externalId,
    answers,
    currentPsp: req.account.paymentProvider,
    providerSwitchEnabled: account.providerSwitchEnabled,
    ...(req.account.providerSwitchEnabled && {
      switchingPsp: PaymentProviders.WORLDPAY, // Stripe can only switch to Worldpay (currently)
      switchPspLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
        req.service.externalId,
        req.account.type
      )
    })
  })
}

module.exports.get = get
module.exports.getAccountDetails = getAccountDetails
module.exports.bankDetails = require('./bank-details/bank-details.controller')
module.exports.companyNumber = require('./company-number/company-number.controller')
module.exports.director = require('./director/director.controller')
module.exports.governmentEntityDocument = require('./government-entity-document/government-entity-document.controller')
module.exports.organisationDetails = require('./organisation-details/organisation-details.controller')
module.exports.responsiblePerson = require('./responsible-person/responsible-person.controller')
module.exports.vatNumber = require('./vat-number/vat-number.controller')
