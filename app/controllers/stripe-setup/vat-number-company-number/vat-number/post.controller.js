'use strict'

const lodash = require('lodash')

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

    const companyNumberDeclaration = lodash.get(req, 'session.pageData.stripeSetup.companyNumberData.companyNumberDeclaration')

    if (companyNumberDeclaration) {
      return res.redirect(303, stripeSetup.checkYourAnswers)
    }
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
