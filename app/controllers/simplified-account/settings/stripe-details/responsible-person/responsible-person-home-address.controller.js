const { response } = require('../../../../../utils/response')
const formatSimplifiedAccountPathsFor = require('../../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('../../../../../paths')
const { responsiblePersonSchema } = require('../../../../../utils/simplified-account/validation/responsible-person.schema')
const { validationResult } = require('express-validator')
const formatValidationErrors = require('../../../../../utils/simplified-account/format/format-validation-errors')
const checkTaskCompletion = require('../../../../../middleware/simplified-account/check-task-completion')
const { stripeDetailsTasks } = require('../../../../../utils/simplified-account/settings/stripe-details/tasks')

async function get (req, res) {
  const { address } = req.session?.formData ?? {}
  return response(req, res, 'simplified-account/settings/stripe-details/responsible-person/home-address', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.index, req.service.externalId, req.account.type),
    address
  })
}

async function post (req, res) {
  const validations = [
    responsiblePersonSchema.address.homeAddressLine1.validate,
    responsiblePersonSchema.address.homeAddressLine2.validate,
    responsiblePersonSchema.address.homeAddressCity.validate,
    responsiblePersonSchema.address.homeAddressPostcode.validate
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
  req.session.formData = {
    ...req.session.formData,
    address: {
      homeAddressLine1,
      homeAddressLine2,
      homeAddressCity,
      homeAddressPostcode
    }
  }
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
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type),
  })
}

module.exports = {
  get: [checkTaskCompletion(stripeDetailsTasks.responsiblePerson.name), get],
  post: [checkTaskCompletion(stripeDetailsTasks.responsiblePerson.name), post]
}
