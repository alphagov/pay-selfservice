const { response } = require('@utils/response')
const { friendlyStripeTasks } = require('@utils/simplified-account/settings/stripe-details/tasks')
const { getStripeAccountOnboardingDetails } = require('@services/stripe-details.service')

async function get (req, res) {
  const account = req.account
  const service = req.service
  const stripeDetailsTasks = friendlyStripeTasks(account, service)
  const incompleteTasks = Object.values(stripeDetailsTasks).some(task => task.status === false)
  let answers = {}
  if (!incompleteTasks) {
    const stripeAccountOnboardingDetails = await getStripeAccountOnboardingDetails(service, account)
    answers = {
      ...stripeAccountOnboardingDetails
    }
  }
  return response(req, res, 'simplified-account/settings/stripe-details/index', {
    messages: res.locals?.flash?.messages ?? [],
    stripeDetailsTasks,
    incompleteTasks,
    serviceId: service.externalId,
    answers
  })
}

module.exports.get = get
module.exports.bankAccount = require('./bank-account/bank-account.controller')
module.exports.companyNumber = require('./company-number/company-number.controller')
module.exports.director = require('./director/director.controller')
module.exports.governmentEntityDocument = require('./government-entity-document/government-entity-document.controller')
module.exports.organisationDetails = require('./organisation-details/organisation-details.controller')
module.exports.responsiblePerson = require('./responsible-person/responsible-person.controller')
module.exports.vatNumber = require('./vat-number/vat-number.controller')
