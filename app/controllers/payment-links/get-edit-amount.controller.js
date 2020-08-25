'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const formattedPathFor = require('../../utils/replace-params-in-path')
const supportedLanguage = require('../../models/supported-language')

module.exports = function showEditAmountPage (req, res, next) {
  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData) {
    return next(new Error('Edit payment link data not found in session cookie'))
  }

  const recovered = sessionData.amountPageRecovered || {}
  delete sessionData.amountPageRecovered

  const self = formattedPathFor(paths.paymentLinks.editAmount, req.params.productExternalId)
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
