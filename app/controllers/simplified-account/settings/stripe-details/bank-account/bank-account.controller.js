const paths = require('@root/paths')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const { checkTaskCompletion } = require('@middleware/simplified-account')
const { response } = require('@utils/response')
const { body, validationResult } = require('express-validator')
const { updateStripeDetailsBankAccount } = require('@services/stripe-details.service')
const { stripeDetailsTasks } = require('@utils/simplified-account/settings/stripe-details/tasks')

const ACCT_NUMBER_ERR_MSG = 'Enter a valid account number like 00733445'

async function get (req, res) {
  return response(req, res, 'simplified-account/settings/stripe-details/bank-account/index', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type),
    submitLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.bankAccount, req.service.externalId, req.account.type)
  })
}

async function post (req, res, next) {
  const validations = [
    body('sortCode').trim()
      .notEmpty().withMessage('Enter a sort code').bail()
      .matches(/^\d{2}[ -]?\d{2}[ -]?\d{2}$/).withMessage('Enter a valid sort code like 30-94-30 or 309430'), // 6 digits with optional dashes and spaces
    body('accountNumber').trim()
      .notEmpty().withMessage('Enter an account number').bail()
      .isNumeric().withMessage(ACCT_NUMBER_ERR_MSG).bail()
      .isLength({ max: 8, min: 6 }).withMessage(ACCT_NUMBER_ERR_MSG)
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

  const sortCode = req.body.sortCode.replace(/\D/g, '')
  const accountNumber = req.body.accountNumber.replace(/\D/g, '')

  try {
    await updateStripeDetailsBankAccount(req.service, req.account, sortCode, accountNumber)
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type))
  } catch (error) {
    // handle Stripe API errors
    switch (error.code) {
      case 'bank_account_unusable':
        return postErrorResponse(req, res, {
          summary: [{ text: 'The bank account provided cannot be used. Contact GOV.UK Pay for assistance.' }]
        })
      case 'routing_number_invalid':
        return postErrorResponse(req, res, {
          summary: [{ text: 'Invalid sort code', href: '#sort-code' }],
          formErrors: { sortCode: 'The sort code provided is invalid' }
        })
      case 'account_number_invalid':
        return postErrorResponse(req, res, {
          summary: [{ text: 'Invalid account number', href: '#account-number' }],
          formErrors: { accountNumber: 'The account number provided is invalid' }
        })
      default:
        next(error)
    }
  }
}

const postErrorResponse = (req, res, errors) => {
  return response(req, res, 'simplified-account/settings/stripe-details/bank-account/index', {
    errors,
    sortCode: req.body.sortCode,
    accountNumber: req.body.accountNumber,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type),
    submitLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.bankAccount, req.service.externalId, req.account.type)
  })
}

module.exports = {
  get: [checkTaskCompletion(stripeDetailsTasks.bankAccount.name), get],
  post: [checkTaskCompletion(stripeDetailsTasks.bankAccount.name), post]
}
