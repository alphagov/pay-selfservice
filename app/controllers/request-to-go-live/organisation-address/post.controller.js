'use strict'

// NPM dependencies
const lodash = require('lodash')
const logger = require('winston')

// Local dependencies
const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const goLiveStage = require('../../../models/go-live-stage')
const { requestToGoLive } = require('../../../paths')
const {
  validateMandatoryField, validateOptionalField, validatePostcode, validatePhoneNumber
} = require('../../../utils/validation/server-side-form-validations')
const { updateService } = require('../../../services/service_service')
const { renderErrorView } = require('../../../utils/response')
const { validPaths, ServiceUpdateRequest } = require('../../../models/ServiceUpdateRequest.class')

const clientFormIds = {
  addressLine1: 'address-line1',
  addressLine2: 'address-line2',
  addressCity: 'address-city',
  addressPostcode: 'address-postcode',
  addressCountry: 'address-country',
  telephoneNumber: 'telephone-number'
}

const validationRules = [
  {
    field: clientFormIds.addressLine1,
    validator: validateMandatoryField,
    maxLength: 200
  },
  {
    field: clientFormIds.addressLine2,
    validator: validateOptionalField,
    maxLength: 200
  },
  {
    field: clientFormIds.addressCity,
    validator: validateMandatoryField,
    maxLength: 100
  },
  {
    field: clientFormIds.addressCountry,
    validator: validateMandatoryField,
    maxLength: 2
  },
  {
    field: clientFormIds.telephoneNumber,
    validator: validatePhoneNumber
  }
]

const trimField = (key, store) => lodash.get(store, key, '').trim()

const normaliseForm = (formBody) => {
  const fields = [
    clientFormIds.addressLine1,
    clientFormIds.addressLine2,
    clientFormIds.addressCity,
    clientFormIds.addressCountry,
    clientFormIds.addressPostcode,
    clientFormIds.telephoneNumber
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

  const postCode = form[clientFormIds.addressPostcode]
  const country = form[clientFormIds.addressCountry]
  const postCodeValidResponse = validatePostcode(postCode, country)
  if (!postCodeValidResponse.valid) {
    errors[clientFormIds.addressPostcode] = postCodeValidResponse.message
  }
  return errors
}

const submitForm = async function (form, serviceExternalId, correlationId) {
  const updateRequest = new ServiceUpdateRequest()
    .replace(validPaths.merchantDetails.addressLine1, form[clientFormIds.addressLine1])
    .replace(validPaths.merchantDetails.addressLine2, form[clientFormIds.addressLine2])
    .replace(validPaths.merchantDetails.addressCity, form[clientFormIds.addressCity])
    .replace(validPaths.merchantDetails.addressPostcode, form[clientFormIds.addressPostcode])
    .replace(validPaths.merchantDetails.addressCountry, form[clientFormIds.addressCountry])
    .replace(validPaths.merchantDetails.telephoneNumber, form[clientFormIds.telephoneNumber])
    .replace(validPaths.currentGoLiveStage, goLiveStage.ENTERED_ORGANISATION_ADDRESS)
    .formatPayload()

  return updateService(serviceExternalId, updateRequest, correlationId)
}

const buildErrorsPageData = (form, errors) => {
  return {
    success: false,
    errors: errors,
    address_line1: form[clientFormIds.addressLine1],
    address_line2: form[clientFormIds.addressLine2],
    address_city: form[clientFormIds.addressCity],
    address_postcode: form[clientFormIds.addressPostcode],
    address_country: form[clientFormIds.addressCountry],
    telephone_number: form[clientFormIds.telephoneNumber]
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
