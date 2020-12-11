'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const formattedPathFor = require('../../utils/replace-params-in-path')
const supportedLanguage = require('../../models/supported-language')

module.exports = function showEditAmountPage (req, res) {
  const { productExternalId } = req.params

  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData || sessionData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    return res.redirect(paths.paymentLinks.manage.index)
  }

  const recovered = sessionData.amountPageRecovered || {}
  delete sessionData.amountPageRecovered

  const self = formattedPathFor(paths.paymentLinks.manage.editAmount, productExternalId)
  const change = lodash.get(req, 'query.field', {})
  const amountType = recovered.type || sessionData.price ? 'fixed' : 'variable'
  const amountInPence = recovered.amount || sessionData.price
  const isWelsh = sessionData.language === supportedLanguage.WELSH

  const pageData = {
    self,
    change,
    amountType,
    amountInPence,
    isWelsh,
    errors: recovered.errors
  }
  return response(req, res, 'payment-links/edit-amount', pageData)
}
