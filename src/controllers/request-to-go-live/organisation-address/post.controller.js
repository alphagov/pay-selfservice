'use strict'

const lodash = require('lodash')

const logger = require('@utils/logger')(__filename)
const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const goLiveStage = require('@models/constants/go-live-stage')
const {
  validateMandatoryField,
  validateOptionalField,
  validatePostcode,
  validatePhoneNumber,
  validateUrl
} = require('@utils/validation/server-side-form-validations')
const { updateService } = require('@services/service.service')
const { ServiceUpdateRequest } = require('@models/ServiceUpdateRequest.class')
const formatServicePathsFor = require('@utils/format-service-paths-for')
const { response } = require('@utils/response')
const { countries } = require('@govuk-pay/pay-js-commons').utils

const clientFieldNames = {
  name: 'merchant-name',
  addressLine1: 'address-line1',
  addressLine2: 'address-line2',
  addressCity: 'address-city',
  addressPostcode: 'address-postcode',
  addressCountry: 'address-country',
  telephoneNumber: 'telephone-number',
  url: 'url'
}

const validationRules = [
  {
    field: clientFieldNames.addressLine1,
    validator: validateMandatoryField,
    maxLength: 255,
    fieldDisplayName: 'building and street'
  },
  {
    field: clientFieldNames.addressLine2,
    validator: validateOptionalField,
    maxLength: 255,
    fieldDisplayName: 'building and street'
  },
  {
    field: clientFieldNames.addressCity,
    validator: validateMandatoryField,
    maxLength: 255,
    fieldDisplayName: 'town or city'
  }
]

const validationRulesWithTelAndUrl = [
  {
    field: clientFieldNames.telephoneNumber,
    validator: validatePhoneNumber
  },
  {
    field: clientFieldNames.url,
    validator: validateURLWithTracking
  },
  ...validationRules
]


const trimField = (key, store) => lodash.get(store, key, '').trim()

function normaliseForm (formBody) {
  const fields = [
    clientFieldNames.name,
    clientFieldNames.addressLine1,
    clientFieldNames.addressLine2,
    clientFieldNames.addressCity,
    clientFieldNames.addressCountry,
    clientFieldNames.addressPostcode,
    clientFieldNames.telephoneNumber,
    clientFieldNames.url
  ]
  return fields.reduce((form, field) => {
    form[field] = trimField(field, formBody)
    return form
  }, {})
}

function validateURLWithTracking (url) {
  const result = validateUrl(url)
  if (!result.valid) {
    logger.info('Blocked provided URL', { url })
  }
  return result
}

function validateForm (form) {
  const errors = validationRulesWithTelAndUrl.reduce((errors, validationRule) => {
    const value = form[validationRule.field]
    const validationResponse = validationRule.validator(value, validationRule.maxLength,
      validationRule.fieldDisplayName, true)
    if (!validationResponse.valid) {
      errors[validationRule.field] = validationResponse.message
    }
    return errors
  }, {})

  const country = form[clientFieldNames.addressCountry]
  if (!country || country.length !== 2) {
    errors[clientFieldNames.country] = 'Select a country'
  }

  const postCode = form[clientFieldNames.addressPostcode]
  const postCodeValidResponse = validatePostcode(postCode, country)
  if (!postCodeValidResponse.valid) {
    errors[clientFieldNames.addressPostcode] = postCodeValidResponse.message
  }
  return lodash.pick(errors, Object.values(clientFieldNames))
}

async function submitForm (form, req) {
    const updateRequest = new ServiceUpdateRequest()
      .replace().merchantDetails.addressLine1(form[clientFieldNames.addressLine1])
      .replace().merchantDetails.addressLine2(form[clientFieldNames.addressLine2])
      .replace().merchantDetails.addressCity(form[clientFieldNames.addressCity])
      .replace().merchantDetails.addressPostcode(form[clientFieldNames.addressPostcode])
      .replace().merchantDetails.addressCountry(form[clientFieldNames.addressCountry])
      .replace().merchantDetails.telephoneNumber(form[clientFieldNames.telephoneNumber])
      .replace().merchantDetails.url(form[clientFieldNames.url])

  updateRequest.replace().currentGoLiveStage(goLiveStage.ENTERED_ORGANISATION_ADDRESS)

  return updateService(req.service.externalId, updateRequest.formatPayload())
}

function buildErrorsPageData (
  form,
  errors
) {
  return {
    errors,
    name: form[clientFieldNames.name],
    addressLine1: form[clientFieldNames.addressLine1],
    addressLine2: form[clientFieldNames.addressLine2],
    addressCity: form[clientFieldNames.addressCity],
    addressPostcode: form[clientFieldNames.addressPostcode],
    telephoneNumber: form[clientFieldNames.telephoneNumber],
    url: form[clientFieldNames.url],
    countries: countries.govukFrontendFormatted(form[clientFieldNames.addressCountry]),
  }
}

module.exports = async function submitOrganisationAddress (req, res, next) {
  try {
    const form = normaliseForm(req.body)
    const errors = validateForm(form)

    if (lodash.isEmpty(errors)) {
      const updatedService = await submitForm(form, req)

      res.redirect(303, formatServicePathsFor(goLiveStageToNextPagePath[updatedService.currentGoLiveStage], req.service.externalId))

    } else {
      const pageData = buildErrorsPageData(
        form,
        errors
      )

      return response(req, res, 'request-to-go-live/organisation-address', pageData)
    }
  } catch (err) {
    next(err)
  }
}
