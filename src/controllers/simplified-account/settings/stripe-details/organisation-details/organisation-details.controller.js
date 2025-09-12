const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { validationResult, body } = require('express-validator')
const { formatValidationErrors } = require('@utils/simplified-account/format')
const { updateConnectorStripeProgress } = require('@services/stripe-details.service')
const { checkTaskCompletion } = require('@middleware/simplified-account')
const StripeTaskIdentifiers = require('@models/task-workflows/task-identifiers/stripe-task-identifiers')

async function get (req, res) {
  const { merchantDetails } = req.service
  return response(req, res, 'simplified-account/settings/stripe-details/organisation-details/index', {
    organisationName: merchantDetails.name,
    organisationAddress: ['addressLine1', 'addressLine2', 'addressCity', 'addressPostcode'].map(k => merchantDetails?.[k]).filter(v => v && v !== '').join('<br>'),
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
  const isCorrect = req.body.confirmOrgDetails === 'true'
  if (isCorrect) {
    updateConnectorStripeProgress(req.service, req.account, 'organisation_details')
      .then(() => {
        res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type))
      })
  } else {
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.organisationDetails.update, req.service.externalId, req.account.type))
  }
}

const postErrorResponse = (req, res, errors) => {
  const { merchantDetails } = req.service
  return response(req, res, 'simplified-account/settings/stripe-details/organisation-details/index', {
    errors,
    organisationName: merchantDetails.name,
    organisationAddress: ['addressLine1', 'addressLine2', 'addressCity', 'addressPostcode'].map(k => merchantDetails?.[k]).filter(v => v && v !== '').join('<br>'),
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type)
  })
}

module.exports.get = [checkTaskCompletion(StripeTaskIdentifiers.ORG.connectorName), get]
module.exports.post = [checkTaskCompletion(StripeTaskIdentifiers.ORG.connectorName), post]
module.exports.update = require('./organisation-details-update.controller')
