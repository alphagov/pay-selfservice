const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { validationResult, body } = require('express-validator')
const { formatValidationErrors } = require('@utils/simplified-account/format')
const { updateConnectorStripeProgress } = require('@services/stripe-details.service')
const { checkTaskCompletion } = require('@middleware/simplified-account')
const { stripeDetailsTasks } = require('@utils/simplified-account/settings/stripe-details/tasks')

async function get (req, res) {
  const { merchantDetails } = req.service
  return response(req, res, 'simplified-account/settings/stripe-details/organisation-details/index', {
    organisationName: merchantDetails.name,
    organisationAddress: ['address_line1', 'address_line2', 'address_city', 'address_postcode'].map(k => merchantDetails?.[k]).filter(v => v && v !== '').join('<br>'),
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const validations = [
    body('confirmOrgDetails')
      .custom(value => {
        if (value === undefined) {
          throw new Error('Select yes if your organisation’s details match the details on your government entity document')
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
  await updateConnectorStripeProgress(req.service, req.account, 'organisation_details')
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type))
}

const postErrorResponse = (req, res, errors) => {
  const { merchantDetails } = req.service
  return response(req, res, 'simplified-account/settings/stripe-details/organisation-details/index', {
    errors,
    organisationName: merchantDetails.name,
    organisationAddress: ['address_line1', 'address_line2', 'address_city', 'address_postcode'].map(k => merchantDetails?.[k]).filter(v => v && v !== '').join('<br>'),
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type)
  })
}

module.exports = {
  get: [checkTaskCompletion(stripeDetailsTasks.organisationDetails.name), get],
  post: [checkTaskCompletion(stripeDetailsTasks.organisationDetails.name), post]
}
