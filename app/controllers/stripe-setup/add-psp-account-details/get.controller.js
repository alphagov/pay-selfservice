'use strict'

const paths = require('../../../paths')
const { response, renderErrorView } = require('../../../utils/response')

module.exports = async (req, res) => {
  if (!req.account || !req.account.connectorGatewayAccountStripeProgress) {
    return renderErrorView(req, res, 'Please try again or contact support team')
  }

  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

  if (!stripeAccountSetup.bankAccount) {
    res.redirect(303, paths.stripeSetup.bankDetails)
  } else if (!stripeAccountSetup.responsiblePerson) {
    res.redirect(303, paths.stripeSetup.responsiblePerson)
  } else if (!stripeAccountSetup.vatNumber) {
    res.redirect(303, paths.stripeSetup.vatNumber)
  } else if (!stripeAccountSetup.companyNumber) {
    res.redirect(303, paths.stripeSetup.companyNumber)
  } else {
    response(req, res, 'stripe-setup/go-live-complete', {
      dashboardLink: paths.account.formatPathFor(paths.account.dashboard.index, req.account.externalId)
    })
  }
}
