'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../../utils/response')
const vatNumberValidations = require('./vat-number-validations')

// Constants
const VAT_NUMBER_FIELD = 'vat-number'
const VAT_NUMBER_MAX_LENGTH = '14'

module.exports = (req, res) => {
  const rawVatNumber = lodash.get(req.body, VAT_NUMBER_FIELD, '').trim()
  const errors = validateVatNumber(rawVatNumber)
  if (!lodash.isEmpty(errors)) {
    return response(req, res, 'stripe-setup/vat-number-company-number/vat-number', {
      vatNumber: rawVatNumber,
      errors
    })
  } else {
    // todo goto tax-id page
  }

  function validateVatNumber (vatNumber) {
    const errors = {}

    const vatNumberValidationResult = vatNumberValidations.validateMandatoryField(vatNumber, VAT_NUMBER_MAX_LENGTH)
    if (!vatNumberValidationResult.valid) {
      errors[VAT_NUMBER_FIELD] = vatNumberValidationResult.message
    }

    return errors
  }
}
