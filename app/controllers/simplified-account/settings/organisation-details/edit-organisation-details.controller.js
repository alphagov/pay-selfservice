const _ = require('lodash')
const { validationResult } = require('express-validator')
const { countries } = require('@govuk-pay/pay-js-commons').utils

const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const { organisationDetailsSchema } = require('@utils/simplified-account/validation/organisation-details.schema')

function get (req, res) {
  const organisationDetails = {
    organisationName: '',
    address: '',
    telephoneNumber: '',
    websiteAddress: ''
  }
  const context = {
    messages: res.locals?.flash?.messages ?? [],
    organisationDetails,
    submitLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.edit, req.service.externalId, req.account.type),
    countries: countries.govukFrontendFormatted()
  }
  return response(req, res, 'simplified-account/settings/organisation-details/edit-organisation-details', context)
}

function post (req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/organisation-details/edit-organisation-details', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors
      },
      organisationDetails: _.pick(req.body, ['organisationName', 'addressLine1', 'addressLine2', 'addressCity', 'addressPostcode', 'telephoneNumber', 'organisationUrl']),
      submitLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.edit, req.service.externalId, req.account.type),
      countries: countries.govukFrontendFormatted()
    })
  }

  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.index, req.service.externalId, req.account.type))
}

const postValidation = [
  organisationDetailsSchema.organisationName.validate,
  organisationDetailsSchema.organisationAddress.line1.validate,
  organisationDetailsSchema.organisationAddress.line2.validate,
  organisationDetailsSchema.organisationAddress.city.validate,
  organisationDetailsSchema.organisationAddress.postcode.validate,
  organisationDetailsSchema.organisationAddress.country.validate,
  organisationDetailsSchema.telephoneNumber.validate,
  organisationDetailsSchema.organisationUrl.validate
]
module.exports = {
  get,
  post: [postValidation, post]
}
