'use strict'

const { response } = require('../../../utils/response')
const stripeClient = require('../../../services/clients/stripe/stripe.client')

async function compliancePage (req, res, next) {
  const { stripeAccountId } = res.locals.stripeAccount

  try {
    const responsiblePerson = await stripeClient.retrieveResponsiblePerson(stripeAccountId)
    response(req, res, 'stripe-setup/compliance/index', { responsiblePerson })
  } catch (error) {
    next(error)
  }
}

function updateStripeAccountForCompliance (req, res, next) {

}

module.exports = {
  compliancePage: compliancePage,
  updateStripeAccountForCompliance: updateStripeAccountForCompliance
}
