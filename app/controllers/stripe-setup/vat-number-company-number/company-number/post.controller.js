'use strict'

const lodash = require('lodash')

const { stripeSetup } = require('../../../../paths')
const companyNumberValidations = require('./company-number-validations')

// Constants
const COMPANY_NUMBER_DECLARATION_FIELD = 'company-number-declaration'
const COMPANY_NUMBER_FIELD = 'company-number'

module.exports = (req, res) => {
  const companyNumberDeclaration = lodash.get(req.body, COMPANY_NUMBER_DECLARATION_FIELD, '')
  const rawCompanyNumber = lodash.get(req.body, COMPANY_NUMBER_FIELD, '')
  const trimmedCompanyNumber = rawCompanyNumber.trim()

  if (lodash.isEmpty(lodash.get(req, 'session.pageData.stripeSetup.vatNumberData.vatNumber'))) {
    return res.redirect(303, stripeSetup.vatNumberCompanyNumber)
  }

  const errors = validateCompanyNumberForm(companyNumberDeclaration, trimmedCompanyNumber)
  if (!lodash.isEmpty(errors)) {
    lodash.set(req, 'session.pageData.stripeSetup.companyNumberData', {
      errors: errors,
      companyNumberDeclaration: companyNumberDeclaration,
      companyNumber: rawCompanyNumber
    })
    return res.redirect(303, stripeSetup.companyNumber)
  } else {
    const sessionCompanyNumber = (companyNumberDeclaration === 'false') ? '' : trimmedCompanyNumber
    lodash.set(req, 'session.pageData.stripeSetup.companyNumberData', {
      errors: {},
      companyNumberDeclaration: companyNumberDeclaration,
      companyNumber: sessionCompanyNumber
    })
    return res.redirect(303, stripeSetup.checkYourAnswers)
  }
}

function validateCompanyNumberForm (companyNumberDeclaration, companyNumber) {
  const errors = {}

  const companyNumberDeclarationValidationResult = companyNumberValidations.validateCompanyNumberDeclaration(companyNumberDeclaration)
  if (!companyNumberDeclarationValidationResult.valid) {
    errors[COMPANY_NUMBER_DECLARATION_FIELD] = companyNumberDeclarationValidationResult.message
  } else if (companyNumberDeclaration === 'true') {
    const companyNumberValidationResult = companyNumberValidations.validateCompanyNumber(companyNumber)
    if (!companyNumberValidationResult.valid) {
      errors[COMPANY_NUMBER_FIELD] = companyNumberValidationResult.message
    }
  }

  return errors
}
