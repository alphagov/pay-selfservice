const _ = require('lodash')
const { validationResult } = require('express-validator')
const { countries } = require('@govuk-pay/pay-js-commons').utils

const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const { organisationDetailsSchema } = require('@utils/simplified-account/validation/organisation-details.schema')
const { ServiceUpdateRequest } = require('@models/ServiceUpdateRequest.class')
const { updateService } = require('@services/service.service')
const { ValidationError } = require('@root/errors')

function get (req, res) {
  const organisationDetails = {
    organisationName: req.service?.merchantDetails?.name || '',
    addressLine1: req.service?.merchantDetails?.address_line1 || '',
    addressLine2: req.service?.merchantDetails?.address_line2 || '',
    addressCity: req.service?.merchantDetails?.address_city || '',
    addressPostcode: req.service?.merchantDetails?.address_postcode || '',
    addressCountry: req.service?.merchantDetails?.address_country || '',
    telephoneNumber: req.service?.merchantDetails?.telephone_number || '',
    organisationUrl: req.service?.merchantDetails?.url || ''
  }
  const context = {
    messages: res.locals?.flash?.messages ?? [],
    organisationDetails,
    countries: countries.govukFrontendFormatted(organisationDetails.addressCountry),
    backLink: req.service?.merchantDetails && formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.index, req.service.externalId, req.account.type)
  }
  return response(req, res, 'simplified-account/settings/organisation-details/edit-organisation-details', context)
}

async function post (req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ValidationError('simplified-account/settings/organisation-details/edit-organisation-details', errors, {
      organisationDetails: _.pick(req.body, ['organisationName', 'addressLine1', 'addressLine2', 'addressCity', 'addressPostcode', 'telephoneNumber', 'organisationUrl']),
      countries: countries.govukFrontendFormatted(req.body.addressCountry),
      backLink: req.service?.merchantDetails && formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.index, req.service.externalId, req.account.type)
    })
  }

  const serviceUpdates = new ServiceUpdateRequest()
    .replace().merchantDetails.name(req.body.organisationName)
    .replace().merchantDetails.addressLine1(req.body.addressLine1)
    .replace().merchantDetails.addressLine2(req.body.addressLine2)
    .replace().merchantDetails.addressCity(req.body.addressCity)
    .replace().merchantDetails.addressPostcode(req.body.addressPostcode)
    .replace().merchantDetails.addressCountry(req.body.addressCountry)
    .replace().merchantDetails.telephoneNumber(req.body.telephoneNumber)
    .replace().merchantDetails.url(req.body.organisationUrl)
    .formatPayload()

  await updateService(req.service.externalId, serviceUpdates)

  return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.index, req.service.externalId, req.account.type))
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
