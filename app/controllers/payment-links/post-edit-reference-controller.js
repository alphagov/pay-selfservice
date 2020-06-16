'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const formattedPathFor = require('../../utils/replace_params_in_path')

module.exports = (req, res) => {
  const editData = lodash.get(req, 'session.editPaymentLinkData', {})

  editData.referenceEnabled = req.body['reference-type-group'] === 'custom'
  editData.referenceLabel = req.body['reference-type-group'] === 'custom' ? req.body['reference-label'] : ''
  editData.referenceHint = req.body['reference-type-group'] === 'custom' ? req.body['reference-hint-text'] : ''
  lodash.set(req, 'session.editPaymentLinkData', editData)

  if (req.body['reference-type-group'] === 'custom') {
    if (req.body['reference-label'] === '') {
      req.flash('genericError', `<h2>There was a problem with the details you gave for:</h2><ul class="govuk-list govuk-error-summary__list"><li><a href="#reference-label">Name of your payment reference number</a></li></ul>`)
      req.flash('errorType', `label`)
      return res.redirect(formattedPathFor(paths.paymentLinks.editReference, req.params.productExternalId))
    }
  }

  return res.redirect(formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId))
}
