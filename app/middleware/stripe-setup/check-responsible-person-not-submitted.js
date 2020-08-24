'use strict'

// Local dependencies
const { renderErrorView } = require('../../utils/response')
const paths = require('../../paths')

module.exports = function checkResponsiblePersonNotSubmitted (req, res, next) {
  if (!req.account) {
    renderErrorView(req, res)
    return
  }

  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress
  if (!stripeAccountSetup) {
    renderErrorView(req, res, 'Please try again or contact support team')
  } else {
    if (stripeAccountSetup.responsiblePerson) {
      req.flash('genericError', 'You’ve already nominated your responsible person. Contact GOV.UK Pay support if you need to change them.')
      res.redirect(303, paths.dashboard.index)
    } else {
      next()
    }
  }
}
