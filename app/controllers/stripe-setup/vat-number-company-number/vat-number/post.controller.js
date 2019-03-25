'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { stripeSetup } = require('../../../../paths')
const vatNumberValidations = require('./vat-number-validations')

// Constants
const VAT_NUMBER_FIELD = 'vat-number'

module.exports = (req, res) => {
  const rawVatNumber = lodash.get(req.body, VAT_NUMBER_FIELD, '')
  const vatNumber = rawVatNumber.replace(/\s/g, '').toUpperCase()
  const errors = validateVatNumber(vatNumber)

  if (!lodash.isEmpty(errors)) {
    lodash.set(req, 'session.pageData.stripeSetup.vatNumber', {
      success: false,
      errors: errors,
      vatNumber: rawVatNumber
    })
    return res.redirect(303, stripeSetup.vatNumber)
  } else {
    lodash.set(req, 'session.pageData.stripeSetup.vatNumber', {
      success: true,
      vatNumber: vatNumber
    })
    return res.redirect(303, stripeSetup.companyNumber)
  }
}

function validateVatNumber (vatNumber) {
  const errors = {}

  const vatNumberValidationResult = vatNumberValidations.validateMandatoryField(vatNumber)
  if (!vatNumberValidationResult.valid) {
    errors[VAT_NUMBER_FIELD] = vatNumberValidationResult.message
  }

  return errors
}
