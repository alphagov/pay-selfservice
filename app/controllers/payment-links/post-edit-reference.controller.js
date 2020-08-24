'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')
const formattedPathFor = require('../../utils/replace-params-in-path')

module.exports = (req, res) => {
  const editData = lodash.get(req, 'session.editPaymentLinkData', {})

  editData.referenceEnabled = req.body['reference-type-group'] === 'custom'
  editData.referenceLabel = req.body['reference-type-group'] === 'custom' ? req.body['reference-label'] : ''
  editData.referenceHint = req.body['reference-type-group'] === 'custom' ? req.body['reference-hint-text'] : ''
  lodash.set(req, 'session.editPaymentLinkData', editData)

  if (req.body['reference-type-group'] === 'custom') {
    if (req.body['reference-label'] === '') {
      req.flash('error', 'Enter a name for your payment reference')
      req.flash('errorType', `label`)
      return res.redirect(formattedPathFor(paths.paymentLinks.editReference, req.params.productExternalId))
    }
  }

  return res.redirect(formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId))
}
