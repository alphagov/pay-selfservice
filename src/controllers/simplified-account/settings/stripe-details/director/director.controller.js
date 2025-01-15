const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor, formatValidationErrors } = require('@utils/simplified-account/format')
const { directorValidations } = require('@utils/simplified-account/validation/stripe-person.schema')
const { validationResult } = require('express-validator')
const { updateStripeDetailsDirector } = require('@services/stripe-details.service')
const { checkTaskCompletion } = require('@middleware/simplified-account')
const { stripeDetailsTasks } = require('@utils/simplified-account/settings/stripe-details/tasks')
const paths = require('@root/paths')

async function get (req, res) {
  return response(req, res, 'simplified-account/settings/stripe-details/director/index', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res, next) {
  await Promise.all(directorValidations.map(validation => validation.run(req)))
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return postErrorResponse(req, res, {
      summary: formattedErrors.errorSummary,
      formErrors: formattedErrors.formErrors
    })
  }

  const director = {
    first_name: req.body.firstName.trim(),
    last_name: req.body.lastName.trim(),
    dob_day: Number(req.body.dobDay),
    dob_month: Number(req.body.dobMonth),
    dob_year: Number(req.body.dobYear),
    email: req.body.workEmail.trim()
  }

  updateStripeDetailsDirector(req.service, req.account, director)
    .then(() => {
      res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type))
    })
    .catch((err) => {
      if (err.type === 'StripeInvalidRequestError') {
        return postErrorResponse(req, res, {
          summary: [{ text: 'There is a problem with the information you\'ve submitted. We\'ve not been able to save your details. Email govuk-pay-support@digital.cabinet-office.gov.uk for help.' }]
        })
      }
      next(err)
    })
}

const postErrorResponse = (req, res, errors) => {
  return response(req, res, 'simplified-account/settings/stripe-details/director/index', {
    errors,
    name: {
      firstName: req.body.firstName,
      lastName: req.body.lastName
    },
    dob: {
      dobDay: req.body.dobDay,
      dobMonth: req.body.dobMonth,
      dobYear: req.body.dobYear
    },
    workEmail: req.body.workEmail,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type)
  })
}

module.exports = {
  get: [checkTaskCompletion(stripeDetailsTasks.director.name), get],
  post: [checkTaskCompletion(stripeDetailsTasks.director.name), post]
}
