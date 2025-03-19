const { formatSimplifiedAccountPathsFor, formatValidationErrors } = require('@utils/simplified-account/format/')
const { checkTaskCompletion } = require('@middleware/simplified-account')
const paths = require('@root/paths')
const _ = require('lodash')
const { validationResult } = require('express-validator')
const { response } = require('@utils/response')
const { stripePersonSchema } = require('@utils/simplified-account/validation/stripe-person.schema')
const { stripeDetailsTasks } = require('@utils/simplified-account/settings/stripe-details/tasks')
const { FORM_STATE_KEY } = require('@controllers/simplified-account/settings/stripe-details/responsible-person/constants')

async function get (req, res) {
  const { name, dob } = _.get(req, FORM_STATE_KEY, {})
  return response(req, res, 'simplified-account/settings/stripe-details/responsible-person/index', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type),
    name,
    dob
  })
}

async function post (req, res) {
  const validations = [
    stripePersonSchema.name.firstName.validate,
    stripePersonSchema.name.lastName.validate,
    stripePersonSchema.dob.validate,
    stripePersonSchema.dob.dobDay.validate,
    stripePersonSchema.dob.dobMonth.validate,
    stripePersonSchema.dob.dobYear.validate
  ]
  for (const validation of validations) {
    await validation.run(req)
  }
  const errors = validationResult(req)
    .formatWith(({ msg, path }) => {
      return {
        msg,
        path,
        ...(path === 'dob' ? { pathOverride: 'dobDay' } : {}) // ensure the error summary points at the first field in the dob component if the dob error is generic to all fields in said component
      }
    })
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return postErrorResponse(req, res, {
      summary: formattedErrors.errorSummary,
      formErrors: formattedErrors.formErrors
    })
  }
  const { firstName, lastName, dobDay, dobMonth, dobYear } = req.body
  const existingFormState = _.get(req, FORM_STATE_KEY, {})
  _.set(req, FORM_STATE_KEY, {
    ...existingFormState,
    name: { firstName, lastName },
    dob: { dobDay, dobMonth, dobYear }
  })
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.homeAddress, req.service.externalId, req.account.type))
}

const postErrorResponse = (req, res, errors) => {
  const { firstName, lastName, dobDay, dobMonth, dobYear } = req.body

  return response(req, res, 'simplified-account/settings/stripe-details/responsible-person/index', {
    errors,
    name: { firstName, lastName },
    dob: { dobDay, dobMonth, dobYear },
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type)
  })
}

module.exports.get = [checkTaskCompletion(stripeDetailsTasks.responsiblePerson.name), get]
module.exports.post = [checkTaskCompletion(stripeDetailsTasks.responsiblePerson.name), post]
module.exports.homeAddress = require('./responsible-person-home-address.controller')
module.exports.contactDetails = require('./responsible-person-contact-details.controller')
module.exports.checkYourAnswers = require('./responsible-person-check-answers.controller')
