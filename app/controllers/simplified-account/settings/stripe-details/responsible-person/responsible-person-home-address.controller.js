const { formatSimplifiedAccountPathsFor, formatValidationErrors } = require('@utils/simplified-account/format/')
const { checkTaskCompletion } = require('@middleware/simplified-account')
const paths = require('@root/paths')
const _ = require('lodash')
const { response } = require('@utils/response')
const { stripePersonSchema } = require('@utils/simplified-account/validation/stripe-person.schema')
const { validationResult } = require('express-validator')
const { stripeDetailsTasks } = require('@utils/simplified-account/settings/stripe-details/tasks')
const { FORM_STATE_KEY } = require('@controllers/simplified-account/settings/stripe-details/responsible-person/constants')

async function get (req, res) {
  const { address } = _.get(req, FORM_STATE_KEY, {})
  return response(req, res, 'simplified-account/settings/stripe-details/responsible-person/home-address', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.index, req.service.externalId, req.account.type),
    address
  })
}

async function post (req, res) {
  const validations = [
    stripePersonSchema.address.homeAddressLine1.validate,
    stripePersonSchema.address.homeAddressLine2.validate,
    stripePersonSchema.address.homeAddressCity.validate,
    stripePersonSchema.address.homeAddressPostcode.validate
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

  const { homeAddressLine1, homeAddressLine2, homeAddressCity, homeAddressPostcode } = req.body
  const existingFormState = _.get(req, FORM_STATE_KEY, {})
  _.set(req, FORM_STATE_KEY, {
    ...existingFormState,
    address: {
      homeAddressLine1,
      homeAddressLine2: homeAddressLine2.trim(),
      homeAddressCity,
      homeAddressPostcode
    }
  })
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.contactDetails, req.service.externalId, req.account.type))
}

const postErrorResponse = (req, res, errors) => {
  const { homeAddressLine1, homeAddressLine2, homeAddressCity, homeAddressPostcode } = req.body

  return response(req, res, 'simplified-account/settings/stripe-details/responsible-person/home-address', {
    errors,
    address: {
      homeAddressLine1,
      homeAddressLine2,
      homeAddressCity,
      homeAddressPostcode
    },
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.index, req.service.externalId, req.account.type),
  })
}

module.exports = {
  get: [checkTaskCompletion(stripeDetailsTasks.responsiblePerson.name), get],
  post: [checkTaskCompletion(stripeDetailsTasks.responsiblePerson.name), post]
}
