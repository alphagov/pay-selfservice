'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const supportedLanguage = require('../../models/supported-language')

module.exports = function showEditAmountPage (req, res) {
  const { productExternalId } = req.params

  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData || sessionData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
  }

  const recovered = sessionData.amountPageRecovered || {}
  delete sessionData.amountPageRecovered

  const amountType = recovered.type || sessionData.price ? 'fixed' : 'variable'
  const amountInPence = recovered.amount || sessionData.price
  const amountHint = recovered.hint || sessionData.amountHint
  const isWelsh = sessionData.language === supportedLanguage.WELSH

  const pageData = {
    amountType,
    amountInPence,
    amountHint,
    isWelsh,
    errors: recovered.errors,
    isEditing: true,
    displayFuturePaymentLinksContent: process.env.PAYMENT_LINKS_FUTURE_ENABLED === 'true' || sessionData.newPaymentLinkJourneyEnabled
  }
  return response(req, res, 'payment-links/amount', pageData)
}
