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
  const displayVatNumber = rawVatNumber

  const errors = validateVatNumber(rawVatNumber)
  if (!lodash.isEmpty(errors)) {
    lodash.set(req, 'session.pageData.stripeSetup.vatNumberData', {
      errors: errors,
      vatNumber: rawVatNumber
    })
    return res.redirect(303, stripeSetup.vatNumber)
  } else {
    lodash.set(req, 'session.pageData.stripeSetup.vatNumberData', {
      errors: {},
      vatNumber: displayVatNumber
    })
    return res.redirect(303, stripeSetup.companyNumber)
  }
}

function validateVatNumber (vatNumber) {
  const errors = {}

  const vatNumberValidationResult = vatNumberValidations.validateVatNumber(vatNumber)
  if (!vatNumberValidationResult.valid) {
    errors[VAT_NUMBER_FIELD] = vatNumberValidationResult.message
  }

  return errors
}
