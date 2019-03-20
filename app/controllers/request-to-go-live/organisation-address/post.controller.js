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

const validate = function validate (formFields) {
  const errors = validationRules.reduce((errors, validationRule) => {
    const value = formFields[validationRule.field]
    const validationResponse = validationRule.validator(value, validationRule.maxLength)
    if (!validationResponse.valid) {
      errors[validationRule.field] = validationResponse.message
    }
    return errors
  }, {})

  const postCode = formFields[clientFormIds.addressPostcode]
  const country = formFields[clientFormIds.addressCountry]
  const postCodeValidResponse = validatePostcode(postCode, country)
  if (!postCodeValidResponse.valid) {
    errors[clientFormIds.addressPostcode] = postCodeValidResponse.message
  }
  return errors
}

const submit = async function submit (req, res) {
  const fields = [
    clientFormIds.addressLine1,
    clientFormIds.addressLine2,
    clientFormIds.addressCity,
    clientFormIds.addressCountry,
    clientFormIds.addressPostcode,
    clientFormIds.telephoneNumber
  ]
  const formFields = fields.reduce((form, field) => {
    form[field] = trimField(field, req.body)
    return form
  }, {})

  const errors = validate(formFields)

  if (lodash.isEmpty(errors)) {
    const updateRequest = new ServiceUpdateRequest()
      .replace(validPaths.merchantDetails.addressLine1, formFields[clientFormIds.addressLine1])
      .replace(validPaths.merchantDetails.addressLine2, formFields[clientFormIds.addressLine2])
      .replace(validPaths.merchantDetails.addressCity, formFields[clientFormIds.addressCity])
      .replace(validPaths.merchantDetails.addressPostcode, formFields[clientFormIds.addressPostcode])
      .replace(validPaths.merchantDetails.addressCountry, formFields[clientFormIds.addressCountry])
      .replace(validPaths.merchantDetails.telephoneNumber, formFields[clientFormIds.telephoneNumber])
      .replace(validPaths.currentGoLiveStage, goLiveStage.ENTERED_ORGANISATION_ADDRESS)
      .formatPayload()

    const updatedService = await updateService(req.service.externalId, updateRequest, req.correlationId)

    res.redirect(
      303,
      goLiveStageToNextPagePath[updatedService.currentGoLiveStage].replace(':externalServiceId', req.service.externalId)
    )
  } else {
    lodash.set(req, 'session.pageData.requestToGoLive.organisationAddress', {
      success: false,
      errors: errors,
      address_line1: formFields[clientFormIds.addressLine1],
      address_line2: formFields[clientFormIds.addressLine2],
      address_city: formFields[clientFormIds.addressCity],
      address_postcode: formFields[clientFormIds.addressPostcode],
      address_country: formFields[clientFormIds.addressCountry],
      telephone_number: formFields[clientFormIds.telephoneNumber]
    })
    res.redirect(303, requestToGoLive.organisationAddress.replace(':externalServiceId', req.service.externalId))
  }
}

module.exports = async function (req, res) {
  try {
    await submit(req, res)
  } catch (err) {
    logger.error('Error submitting organisation address - ' + err.stack)
    renderErrorView(req, res)
  }
}
