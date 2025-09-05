const { formatSimplifiedAccountPathsFor, formatValidationErrors } = require('@utils/simplified-account/format/')
const { checkTaskCompletion } = require('@middleware/simplified-account')
const paths = require('@root/paths')
const _ = require('lodash')
const { response } = require('@utils/response')
const { stripePersonSchema } = require('@utils/simplified-account/validation/stripe-person.schema')
const { validationResult } = require('express-validator')
const { FORM_STATE_KEY } = require('@controllers/simplified-account/settings/stripe-details/responsible-person/constants')
const StripeTaskIdentifiers = require('@models/task-workflows/task-identifiers/stripe-task-identifiers')

async function get (req, res) {
  const { contact } = _.get(req, FORM_STATE_KEY, {})
  return response(req, res, 'simplified-account/settings/stripe-details/responsible-person/contact-details', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.homeAddress, req.service.externalId, req.account.type),
    contact
  })
}

async function post (req, res) {
  const validations = [
    stripePersonSchema.contactDetails.workEmail.validate,
    stripePersonSchema.contactDetails.workTelephoneNumber.validate
  ]
  for (const validation of validations) {
    await validation.run(req)
  }
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return postErrorResponse(req, res, {
      summary: formattedErrors.errorSummary,
      formErrors: formattedErrors.formErrors
    })
  }

  const { workTelephoneNumber, workEmail } = req.body
  const existingFormState = _.get(req, FORM_STATE_KEY, {})
  _.set(req, FORM_STATE_KEY, {
    ...existingFormState,
    contact: {
      workTelephoneNumber,
      workEmail
    }
  })
  res.redirect(formatSimplifiedAccountPathsFor(
    paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.checkYourAnswers,
    req.service.externalId,
    req.account.type))
}

const postErrorResponse = (req, res, errors) => {
  const { workTelephoneNumber, workEmail } = req.body

  return response(req, res, 'simplified-account/settings/stripe-details/responsible-person/contact-details', {
    errors,
    contact: {
      workTelephoneNumber,
      workEmail
    },
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.homeAddress, req.service.externalId, req.account.type)
  })
}

module.exports = {
  get: [checkTaskCompletion(StripeTaskIdentifiers.RES_PERSON.connectorName), get],
  post: [checkTaskCompletion(StripeTaskIdentifiers.RES_PERSON.connectorName), post]
}
