const { response } = require('../../../../../utils/response')
const formatSimplifiedAccountPathsFor = require('../../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('../../../../../paths')
const { responsiblePersonSchema } = require('../../../../../utils/simplified-account/validation/responsible-person.schema')
const { validationResult } = require('express-validator')
const formatValidationErrors = require('../../../../../utils/simplified-account/format/format-validation-errors')
const checkTaskCompletion = require('../../../../../middleware/simplified-account/check-task-completion')
const { stripeDetailsTasks } = require('../../../../../utils/simplified-account/settings/stripe-details/tasks')

async function get (req, res) {
  const { contact } = req.session?.formData ?? {}
  return response(req, res, 'simplified-account/settings/stripe-details/responsible-person/contact-details', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.homeAddress, req.service.externalId, req.account.type),
    contact
  })
}

async function post (req, res) {
  const validations = [
    responsiblePersonSchema.contactDetails.workEmail.validate,
    responsiblePersonSchema.contactDetails.workTelephoneNumber.validate
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

  const { workTelephoneNumber, workEmail } = req.body
  req.session.formData = {
    ...req.session.formData,
    contact: {
      workTelephoneNumber,
      workEmail
    }
  }
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
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type),
  })
}

module.exports = {
  get: [checkTaskCompletion(stripeDetailsTasks.responsiblePerson.name), get],
  post: [checkTaskCompletion(stripeDetailsTasks.responsiblePerson.name), post]
}
