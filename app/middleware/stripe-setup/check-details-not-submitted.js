'use strict'

const { renderErrorView } = require('../../utils/response')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

module.exports = function checkDetailsNotSubmitted (page) {
  return function (req, res, next) {
    if (!req.account) {
      renderErrorView(req, res)
      return
    }

    const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress
    if (!stripeAccountSetup) {
      renderErrorView(req, res, 'Please try again or contact support team')
    } else {
      if (page === 'bank-account' && stripeAccountSetup.bankAccount) {
        req.flash('genericError', 'You’ve already provided your bank details. Contact GOV.UK Pay support if you need to update them.')
        return res.redirect(303, formatAccountPathsFor(paths.account.dashboard.index, req.account.external_id))
      }
      if (page === 'company-number' && stripeAccountSetup.companyNumber) {
        req.flash('genericError', 'You’ve already provided your company registration number. Contact GOV.UK Pay support if you need to update them.')
        return res.redirect(303, formatAccountPathsFor(paths.account.dashboard.index, req.account.external_id))
      }
      if (page === 'vat-number' && stripeAccountSetup.vatNumber) {
        req.flash('genericError', 'You’ve already provided your VAT number. Contact GOV.UK Pay support if you need to update them.')
        return res.redirect(303, formatAccountPathsFor(paths.account.dashboard.index, req.account.external_id))
      }
      if (page === 'responsible-person' && stripeAccountSetup.responsiblePerson) {
        req.flash('genericError', 'You’ve already nominated your responsible person. Contact GOV.UK Pay support if you need to update them.')
        return res.redirect(303, formatAccountPathsFor(paths.account.dashboard.index, req.account.external_id))
      }
    }
    next()
  }
}
