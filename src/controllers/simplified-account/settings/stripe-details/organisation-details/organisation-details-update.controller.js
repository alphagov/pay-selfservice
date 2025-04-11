const { checkTaskCompletion } = require('@middleware/simplified-account')
const { stripeDetailsTasks } = require('@utils/simplified-account/settings/stripe-details/tasks')
const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor, formatValidationErrors } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const { updateStripeDetailsOrganisationNameAndAddress } = require('@services/stripe-details.service')
const { validationResult } = require('express-validator')
const { organisationDetailsSchema } = require('@utils/simplified-account/validation/organisation-details.schema')
const { countries } = require('@govuk-pay/pay-js-commons').utils

async function get (req, res) {
  const { merchantDetails } = req.service
  return response(req, res, 'simplified-account/settings/stripe-details/organisation-details/update-organisation-details', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.organisationDetails.index, req.service.externalId, req.account.type),
    organisationDetails: {
      organisationName: merchantDetails.name,
      addressLine1: merchantDetails.addressLine1,
      addressLine2: merchantDetails.addressLine2,
      addressCity: merchantDetails.addressCity,
      addressPostcode: merchantDetails.addressPostcode,
      addressCountry: merchantDetails.addressCountry
    },
    countries: countries.govukFrontendFormatted()
  })
}

async function post (req, res) {
  const validations = [
    organisationDetailsSchema.organisationName.validate,
    organisationDetailsSchema.organisationAddress.line1.validate,
    organisationDetailsSchema.organisationAddress.line2.validate,
    organisationDetailsSchema.organisationAddress.city.validate,
    organisationDetailsSchema.organisationAddress.postcode.validate,
    organisationDetailsSchema.organisationAddress.country.validate
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

  const { organisationName, addressLine1, addressLine2, addressCity, addressPostcode, addressCountry } = req.body

  const newOrgDetails = {
    name: organisationName,
    address_line1: addressLine1,
    address_city: addressCity,
    address_postcode: addressPostcode,
    address_country: addressCountry,
    ...(addressLine2 && { address_line2: addressLine2 })
  }

  updateStripeDetailsOrganisationNameAndAddress(req.service, req.account, newOrgDetails)
    .then(() => {
      res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type))
    })
}

const postErrorResponse = (req, res, errors) => {
  return response(req, res, 'simplified-account/settings/stripe-details/organisation-details/update-organisation-details', {
    errors,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.organisationDetails.index, req.service.externalId, req.account.type),
    organisationDetails: {
      organisationName: req.body.organisationName,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      addressCity: req.body.addressCity,
      addressPostcode: req.body.addressPostcode,
      addressCountry: req.body.addressCountry
    },
    countries: countries.govukFrontendFormatted()
  })
}

module.exports = {
  get: [checkTaskCompletion(stripeDetailsTasks.organisationDetails.name), get],
  post: [checkTaskCompletion(stripeDetailsTasks.organisationDetails.name), post]
}
