'use strict'

const lodash = require('lodash')
const paths = require('../../paths')

const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { validateOptionalField } = require('../../utils/validation/server-side-form-validations')

const LABEL_MAX_LENGTH = 50
const HINT_MAX_LENGTH = 255

module.exports = function postReference (req, res, next) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!sessionData) {
    return next(new Error('Payment link data not found in session cookie'))
  }

  const type = req.body['reference-type-group']
  const label = req.body['reference-label'].trim()
  const hint = req.body['reference-hint-text'].trim()

  const errors = {}
  if (!type) {
    errors.type = 'Would you like us to create a payment reference number for your users?'
  } else if (type === 'custom' && label === '') {
    errors.label = 'Enter a name for your payment reference'
  }
  const validateLabelResult = validateOptionalField(label, LABEL_MAX_LENGTH, 'name of payment reference', true)
  if (!validateLabelResult.valid) {
    errors.label = validateLabelResult.message
  }
  const validateHintResult = validateOptionalField(hint, HINT_MAX_LENGTH, 'hint text', true)
  if (!validateHintResult.valid) {
    errors.hint = validateHintResult.message
  }

  if (!lodash.isEmpty(errors)) {
    sessionData.referencePageRecovered = {
      errors,
      type,
      label,
      hint
    }
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.reference, req.account && req.account.external_id))
  }

  sessionData.paymentReferenceType = type
  sessionData.paymentReferenceLabel = type === 'custom' ? label : ''
  sessionData.paymentReferenceHint = type === 'custom' ? hint : ''

  if (req.body['change'] === 'true') {
    req.flash('generic', 'The details have been updated')
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.review, req.account && req.account.external_id))
  }

  return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.amount, req.account && req.account.external_id))
}
