'use strict'

const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')
const { getCurrentCredential } = require('../../../utils/credentials')
const { response } = require('../../../utils/response')

module.exports = async function getPspAccountDetails (req, res, next) {
  if (!req.account || !req.account.connectorGatewayAccountStripeProgress) {
    return next(new Error('Stripe setup progress is not available on request'))
  }

  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress
  const accountExternalId = req.account.external_id

  // add psp account details flow is currently only used by the go live flow so will
  // only factor in the accounts active credentials
  const credentialId = getCurrentCredential(req.account).external_id

  if (!stripeAccountSetup.bankAccount) {
    res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.stripeSetup.bankDetails, accountExternalId, credentialId))
  } else if (!stripeAccountSetup.responsiblePerson) {
    res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.stripeSetup.responsiblePerson, accountExternalId, credentialId))
  } else if (!stripeAccountSetup.director && process.env.COLLECT_ADDITIONAL_KYC_DATA === 'true') {
    res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.stripeSetup.director, accountExternalId, credentialId))
  } else if (!stripeAccountSetup.vatNumber) {
    res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.stripeSetup.vatNumber, accountExternalId, credentialId))
  } else if (!stripeAccountSetup.companyNumber) {
    res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.stripeSetup.companyNumber, accountExternalId, credentialId))
  } else {
    response(req, res, 'stripe-setup/go-live-complete')
  }
}
