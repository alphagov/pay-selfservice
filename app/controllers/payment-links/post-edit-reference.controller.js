'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { validateOptionalField } = require('../../utils/validation/server-side-form-validations')

const LABEL_MAX_LENGTH = 50
const HINT_MAX_LENGTH = 255

module.exports = function postEditReference (req, res) {
  const { productExternalId } = req.params

  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData || sessionData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
  }

  const referenceEnabled = req.body['reference-type-group'] === 'custom'
  const referenceLabel = req.body['reference-type-group'] === 'custom' ? req.body['reference-label'] : ''
  const referenceHint = req.body['reference-type-group'] === 'custom' ? req.body['reference-hint-text'] : ''

  const errors = {}
  if (req.body['reference-type-group'] === 'custom' && req.body['reference-label'] === '') {
    errors.label = 'Enter a name for your payment reference'
  }
  const validateLabelResult = validateOptionalField(referenceLabel, LABEL_MAX_LENGTH, 'name of payment reference', true)
  if (!validateLabelResult.valid) {
    errors.label = validateLabelResult.message
  }
  const validateHintResult = validateOptionalField(referenceHint, HINT_MAX_LENGTH, 'hint text', true)
  if (!validateHintResult.valid) {
    errors.hint = validateHintResult.message
  }

  if (!lodash.isEmpty(errors)) {
    sessionData.referencePageRecovered = {
      errors,
      referenceEnabled,
      referenceLabel,
      referenceHint
    }
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.editReference, req.account && req.account.external_id, productExternalId))
  }

  sessionData.referenceEnabled = referenceEnabled
  sessionData.referenceLabel = referenceLabel
  sessionData.referenceHint = referenceHint

  return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.edit, req.account && req.account.external_id, productExternalId))
}
