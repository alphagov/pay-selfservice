'use strict'

const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')
const { response, renderErrorView } = require('../../../utils/response')

module.exports = async (req, res) => {
  if (!req.account || !req.account.connectorGatewayAccountStripeProgress) {
    return renderErrorView(req, res, 'Please try again or contact support team')
  }

  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress
  const accountExternalId = req.account.external_id

  if (!stripeAccountSetup.bankAccount) {
    res.redirect(303, formatAccountPathsFor(paths.account.stripeSetup.bankDetails, accountExternalId))
  } else if (!stripeAccountSetup.responsiblePerson) {
    res.redirect(303, formatAccountPathsFor(paths.account.stripeSetup.responsiblePerson, accountExternalId))
  } else if (!stripeAccountSetup.vatNumber) {
    res.redirect(303, formatAccountPathsFor(paths.account.stripeSetup.vatNumber, accountExternalId))
  } else if (!stripeAccountSetup.companyNumber) {
    res.redirect(303, formatAccountPathsFor(paths.account.stripeSetup.companyNumber, accountExternalId))
  } else {
    response(req, res, 'stripe-setup/go-live-complete')
  }
}
