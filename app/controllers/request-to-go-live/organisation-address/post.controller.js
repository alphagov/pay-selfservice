'use strict'

const lodash = require('lodash')

const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const goLiveStage = require('../../../models/go-live-stage')
const paths = require('../../../paths')
const {
  validateMandatoryField,
  validateOptionalField,
  validatePostcode,
  validatePhoneNumber,
  validateUrl
} = require('../../../utils/validation/server-side-form-validations')
const { updateService } = require('../../../services/service.service')
const { validPaths, ServiceUpdateRequest } = require('../../../models/ServiceUpdateRequest.class')
const formatServicePathsFor = require('../../../utils/format-service-paths-for')

const collectAdditionalKycData = process.env.COLLECT_ADDITIONAL_KYC_DATA === 'true'

const clientFieldNames = {
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
    maxLength: 255
  },
  {
    field: clientFieldNames.addressLine2,
    validator: validateOptionalField,
    maxLength: 255
  },
  {
    field: clientFieldNames.addressCity,
    validator: validateMandatoryField,
    maxLength: 255
  },
  {
    field: clientFieldNames.addressCountry,
    validator: validateMandatoryField,
    maxLength: 2
  },
  {
    field: clientFieldNames.telephoneNumber,
    validator: validatePhoneNumber
  }
]

if (collectAdditionalKycData) {
  validationRules.push(
    {
      field: clientFieldNames.url,
      validator: validateUrl
    }
  )
}

const trimField = (key, store) => lodash.get(store, key, '').trim()

const normaliseForm = (formBody) => {
  const fields = [
    clientFieldNames.addressLine1,
    clientFieldNames.addressLine2,
    clientFieldNames.addressCity,
    clientFieldNames.addressCountry,
    clientFieldNames.addressPostcode,
    clientFieldNames.telephoneNumber
  ]
  if (collectAdditionalKycData) {
    fields.push(clientFieldNames.url)
  }
  return fields.reduce((form, field) => {
    form[field] = trimField(field, formBody)
    return form
  }, {})
}

const validateForm = function validate (form) {
  const errors = validationRules.reduce((errors, validationRule) => {
    const value = form[validationRule.field]
    const validationResponse = validationRule.validator(value, validationRule.maxLength)
    if (!validationResponse.valid) {
      errors[validationRule.field] = validationResponse.message
    }
    return errors
  }, {})

  const postCode = form[clientFieldNames.addressPostcode]
  const country = form[clientFieldNames.addressCountry]
  const postCodeValidResponse = validatePostcode(postCode, country)
  if (!postCodeValidResponse.valid) {
    errors[clientFieldNames.addressPostcode] = postCodeValidResponse.message
  }
  return errors
}

const submitForm = async function (form, serviceExternalId, correlationId) {
  const updateRequest = new ServiceUpdateRequest()
    .replace(validPaths.merchantDetails.addressLine1, form[clientFieldNames.addressLine1])
    .replace(validPaths.merchantDetails.addressLine2, form[clientFieldNames.addressLine2])
    .replace(validPaths.merchantDetails.addressCity, form[clientFieldNames.addressCity])
    .replace(validPaths.merchantDetails.addressPostcode, form[clientFieldNames.addressPostcode])
    .replace(validPaths.merchantDetails.addressCountry, form[clientFieldNames.addressCountry])
    .replace(validPaths.merchantDetails.telephoneNumber, form[clientFieldNames.telephoneNumber])
    .replace(validPaths.currentGoLiveStage, goLiveStage.ENTERED_ORGANISATION_ADDRESS)

  if (collectAdditionalKycData) {
    updateRequest.replace(validPaths.merchantDetails.url, form[clientFieldNames.url])
  }

  return updateService(serviceExternalId, updateRequest.formatPayload(), correlationId)
}

const buildErrorsPageData = (form, errors) => {
  return {
    success: false,
    errors: errors,
    address_line1: form[clientFieldNames.addressLine1],
    address_line2: form[clientFieldNames.addressLine2],
    address_city: form[clientFieldNames.addressCity],
    address_postcode: form[clientFieldNames.addressPostcode],
    address_country: form[clientFieldNames.addressCountry],
    telephone_number: form[clientFieldNames.telephoneNumber],
    url: form[clientFieldNames.url],
    collectAdditionalKycData: process.env.COLLECT_ADDITIONAL_KYC_DATA
  }
}

module.exports = async function submitOrganisationAddress (req, res, next) {
  try {
    const form = normaliseForm(req.body)
    const errors = validateForm(form)

    if (lodash.isEmpty(errors)) {
      const updatedService = await submitForm(form, req.service.externalId, req.correlationId)
      res.redirect(
        303,
        formatServicePathsFor(goLiveStageToNextPagePath[updatedService.currentGoLiveStage], req.service.externalId)
      )
    } else {
      const pageData = buildErrorsPageData(form, errors)
      lodash.set(req, 'session.pageData.requestToGoLive.organisationAddress', pageData)
      res.redirect(303, formatServicePathsFor(paths.service.requestToGoLive.organisationAddress, req.service.externalId))
    }
  } catch (err) {
    next(err)
  }
}
