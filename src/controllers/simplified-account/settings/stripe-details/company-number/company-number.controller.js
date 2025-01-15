const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor, formatValidationErrors } = require('@utils/simplified-account/format')
const { checkTaskCompletion } = require('@middleware/simplified-account')
const { stripeDetailsTasks } = require('@utils/simplified-account/settings/stripe-details/tasks')
const { updateStripeDetailsCompanyNumber } = require('@services/stripe-details.service')
const { body, validationResult } = require('express-validator')
const paths = require('@root/paths')

async function get (req, res) {
  return response(req, res, 'simplified-account/settings/stripe-details/company-number/index', {
    companyNumberDeclaration: true,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res, next) {
  const hasCompanyNumber = req.body.companyNumberDeclaration === 'true'
  if (hasCompanyNumber) {
    const validations = [
      body('companyNumber')
        .trim()
        .notEmpty()
        .withMessage('Enter a company registration number').bail()
        .custom(value => {
          const sanitisedCompanyNumber = value.replace(/\s/g, '').toUpperCase()
          if (/^[0-9]{7}$/.test(sanitisedCompanyNumber)) {
            // if the company number is 7 digits exactly then user has probably forgotten the 0
            throw new Error('Limited Company numbers in England and Wales have 8 digits and always start with 0')
          } else if (!/^(?:0[0-9]|OC|LP|SC|SO|SL|NI|R0|NC|NL)[0-9]{6}$/.test(sanitisedCompanyNumber)) {
            // otherwise, check that the company number is valid (can contain letters in some cases)
            throw new Error('Enter a valid Company registration number')
          }
          return true
        })
    ]
    await Promise.all(validations.map(validation => validation.run(req)))
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const formattedErrors = formatValidationErrors(errors)
      return postErrorResponse(req, res, {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors
      })
    }
  }

  try {
    await updateStripeDetailsCompanyNumber(req.service, req.account, hasCompanyNumber
      ? req.body.companyNumber.replace(/\s/g, '').toUpperCase()
      : false)
  } catch (err) {
    if (err.type === 'StripeInvalidRequestError') {
      return postErrorResponse(req, res, {
        summary: [{ text: 'There is a problem with your Company number. Please check your answer and try again.' }]
      })
    }
    next(err)
  }
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type))
}

const postErrorResponse = (req, res, errors) => {
  return response(req, res, 'simplified-account/settings/stripe-details/company-number/index', {
    errors,
    companyNumberDeclaration: req.body.companyNumberDeclaration === 'true',
    companyNumber: req.body.companyNumber,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type)
  })
}

module.exports = {
  get: [checkTaskCompletion(stripeDetailsTasks.companyNumber.name), get],
  post: [checkTaskCompletion(stripeDetailsTasks.companyNumber.name), post]
}
