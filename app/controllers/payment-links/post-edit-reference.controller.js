'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')
const formattedPathFor = require('../../utils/replace-params-in-path')

module.exports = function postEditReference (req, res, next) {
  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData) {
    return next(new Error('Edit payment link data not found in session cookie'))
  }

  const referenceEnabled = req.body['reference-type-group'] === 'custom'
  const referenceLabel = req.body['reference-type-group'] === 'custom' ? req.body['reference-label'] : ''
  const referenceHint = req.body['reference-type-group'] === 'custom' ? req.body['reference-hint-text'] : ''

  if (req.body['reference-type-group'] === 'custom' && req.body['reference-label'] === '') {
    const errors = {
      label: 'Enter a name for your payment reference'
    }
    sessionData.referencePageRecovered = {
      errors,
      referenceEnabled,
      referenceLabel,
      referenceHint
    }
    return res.redirect(formattedPathFor(paths.paymentLinks.editReference, req.params.productExternalId))
  }

  sessionData.referenceEnabled = referenceEnabled
  sessionData.referenceLabel = referenceLabel
  sessionData.referenceHint = referenceHint

  return res.redirect(formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId))
}
