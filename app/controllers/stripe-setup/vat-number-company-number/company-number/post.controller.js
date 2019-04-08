'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { stripeSetup } = require('../../../../paths')
const companyNumberValidations = require('./company-number-validations')

// Constants
const COMPANY_NUMBER_MODE_FIELD = 'company-number-mode'
const COMPANY_NUMBER_FIELD = 'company-number'

module.exports = (req, res) => {
  const rawCompanyNumberMode = lodash.get(req.body, COMPANY_NUMBER_MODE_FIELD, '')
  const rawCompanyNumber = lodash.get(req.body, COMPANY_NUMBER_FIELD, '')
  const trimmedCompanyNumber = rawCompanyNumber.trim()

  const errors = validateCompanyNumberForm(rawCompanyNumberMode, trimmedCompanyNumber)
  if (!lodash.isEmpty(errors)) {
    lodash.set(req, 'session.pageData.stripeSetup.companyNumberData', {
      errors: errors,
      companyNumberMode: rawCompanyNumberMode,
      companyNumber: rawCompanyNumber
    })
    return res.redirect(303, stripeSetup.companyNumber)
  } else {
    const sessionCompanyNumber = (rawCompanyNumberMode === 'no') ? '' : trimmedCompanyNumber
    lodash.set(req, 'session.pageData.stripeSetup.companyNumberData', {
      errors: {},
      companyNumberMode: rawCompanyNumberMode,
      companyNumber: sessionCompanyNumber
    })
    return res.redirect(303, stripeSetup.checkYourAnswers)
  }
}

function validateCompanyNumberForm (companyNumberMode, companyNumber) {
  const errors = {}

  const companyNumberModeValidationResult = companyNumberValidations.validateCompanyNumberMode(companyNumberMode)
  if (!companyNumberModeValidationResult.valid) {
    errors[COMPANY_NUMBER_MODE_FIELD] = companyNumberModeValidationResult.message
  } else if (companyNumberMode === 'yes') {
    const companyNumberValidationResult = companyNumberValidations.validateCompanyNumber(companyNumber)
    if (!companyNumberValidationResult.valid) {
      errors[COMPANY_NUMBER_FIELD] = companyNumberValidationResult.message
    }
  }

  return errors
}
