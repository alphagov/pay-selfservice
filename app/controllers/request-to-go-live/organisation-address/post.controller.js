'use strict'

const lodash = require('lodash')

const logger = require('../../../utils/logger')(__filename)
const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const goLiveStage = require('../../../models/go-live-stage')
const { requestToGoLive } = require('../../../paths')
const {
  validateMandatoryField, validateOptionalField, validatePostcode, validatePhoneNumber
} = require('../../../utils/validation/server-side-form-validations')
const { updateService } = require('../../../services/service.service')
const { renderErrorView } = require('../../../utils/response')
const { validPaths, ServiceUpdateRequest } = require('../../../models/ServiceUpdateRequest.class')

const clientFieldNames = {
  addressLine1: 'address-line1',
  addressLine2: 'address-line2',
  addressCity: 'address-city',
  addressPostcode: 'address-postcode',
  addressCountry: 'address-country',
  telephoneNumber: 'telephone-number'
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
    .formatPayload()

  return updateService(serviceExternalId, updateRequest, correlationId)
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
    telephone_number: form[clientFieldNames.telephoneNumber]
  }
}

module.exports = async function (req, res) {
  try {
    const form = normaliseForm(req.body)
    const errors = validateForm(form)

    if (lodash.isEmpty(errors)) {
      const updatedService = await submitForm(form, req.service.externalId, req.correlationId)
      res.redirect(
        303,
        goLiveStageToNextPagePath[updatedService.currentGoLiveStage].replace(':externalServiceId', req.service.externalId)
      )
    } else {
      const pageData = buildErrorsPageData(form, errors)
      lodash.set(req, 'session.pageData.requestToGoLive.organisationAddress', pageData)
      res.redirect(303, requestToGoLive.organisationAddress.replace(':externalServiceId', req.service.externalId))
    }
  } catch (error) {
    logger.error(`Error submitting organisation address - ${error.stack}`)
    renderErrorView(req, res)
  }
}
