const { formatSimplifiedAccountPathsFor, formatValidationErrors } = require('@utils/simplified-account/format')
const { checkTaskCompletion } = require('@middleware/simplified-account')
const { stripeDetailsTasks } = require('@utils/simplified-account/settings/stripe-details/tasks')
const { response } = require('@utils/response')
const { body, validationResult } = require('express-validator')
const { updateStripeDetailsVatNumber } = require('@services/stripe-details.service')
const paths = require('@root/paths')

async function get (req, res) {
  return response(req, res, 'simplified-account/settings/stripe-details/vat-number/index', {
    vatNumberDeclaration: true,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res, next) {
  const hasVatNumber = req.body.vatNumberDeclaration === 'true'
  if (hasVatNumber) {
    const validations = [
      body('vatNumber')
        .trim()
        .notEmpty()
        .withMessage('Enter a VAT registration number')
        .bail()
        .custom(value => {
          if (!/^((GB)?((\d{9})|(\d{12})|((GD)([0-4])(\d{2}))|((HA)([5-9])(\d{2}))))$/.test(value)) {
            throw new Error('Enter a valid VAT registration number')
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
    await updateStripeDetailsVatNumber(req.service, req.account, hasVatNumber
      ? req.body.vatNumber.replace(/\s/g, '').toUpperCase()
      : false)
  } catch (err) {
    if (err.type === 'StripeInvalidRequestError') {
      return postErrorResponse(req, res, {
        summary: [{ text: 'There is a problem with your VAT number. Please check your answer and try again.' }]
      })
    }
    next(err)
  }
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type))
}

const postErrorResponse = (req, res, errors) => {
  return response(req, res, 'simplified-account/settings/stripe-details/vat-number/index', {
    errors,
    vatNumberDeclaration: req.body.vatNumberDeclaration === 'true',
    vatNumber: req.body.vatNumber,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type)
  })
}

module.exports = {
  get: [checkTaskCompletion(stripeDetailsTasks.vatNumber.name), get],
  post: [checkTaskCompletion(stripeDetailsTasks.vatNumber.name), post]
}
