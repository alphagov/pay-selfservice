const { response } = require('@utils/response')
const { friendlyStripeTasks } = require('@utils/simplified-account/settings/stripe-details/tasks')
const { getStripeAccountOnboardingDetails } = require('@services/stripe-details.service')
const paths = require('@root/paths')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')

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
  const stripeDetailsTasks = friendlyStripeTasks(gatewayAccountStripeProgress, account.type, service.externalId)
  const incompleteTasks = Object.values(stripeDetailsTasks).some(task => task.complete === false)
  let answers = {}
  // load account onboarding details synchronously if javascript is unavailable
  if (!incompleteTasks && javascriptUnavailable) {
    const stripeAccountOnboardingDetails = await getStripeAccountOnboardingDetails(service, account)
    answers = {
      ...stripeAccountOnboardingDetails
    }
  }
  return response(req, res, 'simplified-account/settings/stripe-details/index', {
    javascriptUnavailable,
    accountDetailsPath: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.accountDetails, service.externalId, account.type),
    messages: res.locals?.flash?.messages ?? [],
    tasks: stripeDetailsTasks,
    incompleteTasks,
    serviceExternalId: service.externalId,
    answers,
    providerSwitchEnabled: account.providerSwitchEnabled
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
