'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { validateMandatoryField, validateNaxsiSafe } = require('../../utils/validation/server-side-form-validations')

const TITLE_MAX_LENGTH = 255

module.exports = function postEditInformation (req, res) {
  const { productExternalId } = req.params

  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData || sessionData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
  }

  const name = req.body['payment-link-title']
  const description = req.body['payment-link-description']

  const errors = {}
  const validateTitleResult = validateMandatoryField(name, TITLE_MAX_LENGTH, 'title', true)
  if (!validateTitleResult.valid) {
    errors.title = validateTitleResult.message
  }
  const validateDescriptionResult = validateNaxsiSafe(description, 'details')
  if (!validateDescriptionResult.valid) {
    errors.description = validateDescriptionResult.message
  }

  if (!lodash.isEmpty(errors)) {
    sessionData.informationPageRecovered = {
      errors,
      name,
      description
    }
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.editInformation, req.account && req.account.external_id, productExternalId))
  }

  sessionData.name = name
  sessionData.description = description

  return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.edit, req.account && req.account.external_id, productExternalId))
}
