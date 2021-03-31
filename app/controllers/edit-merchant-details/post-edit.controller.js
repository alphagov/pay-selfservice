'use strict'

const lodash = require('lodash')

const logger = require('../../utils/logger')(__filename)
const { renderErrorView } = require('../../utils/response')
const paths = require('../../paths')
const serviceService = require('../../services/service.service')
const formatServicePathsFor = require('../../utils/format-service-paths-for')
const { validPaths, ServiceUpdateRequest } = require('../../models/ServiceUpdateRequest.class')
const {
  validateMandatoryField, validateOptionalField, validatePostcode, validatePhoneNumber
} = require('../../utils/validation/server-side-form-validations')

const clientFieldNames = {
  name: 'merchant-name',
  telephoneNumber: 'telephone-number',
  addressLine1: 'address-line1',
  addressLine2: 'address-line2',
  addressCity: 'address-city',
  addressPostcode: 'address-postcode',
  addressCountry: 'address-country',
  email: 'merchant-email'
}

const validationRules = [
  {
    field: clientFieldNames.name,
    validator: validateMandatoryField,
    maxLength: 255
  },
  {
    field: clientFieldNames.telephoneNumber,
    validator: validatePhoneNumber
  },
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
  }
]

const trimField = (key, store) => lodash.get(store, key, '').trim()

const normaliseForm = (formBody) => {
  const fields = [
    clientFieldNames.name,
    clientFieldNames.telephoneNumber,
    clientFieldNames.addressLine1,
    clientFieldNames.addressLine2,
    clientFieldNames.addressCity,
    clientFieldNames.addressPostcode,
    clientFieldNames.addressCountry,
    clientFieldNames.email
  ]
  return fields.reduce((form, field) => {
    form[field] = trimField(field, formBody)
    return form
  }, {})
}

const validateForm = (formFields) => {
  const errors = validationRules.reduce((errors, validationRule) => {
    const value = formFields[validationRule.field]
    const validationResponse = validationRule.validator(value, validationRule.maxLength)
    if (!validationResponse.valid) {
      errors[validationRule.field] = validationResponse.message
    }
    return errors
  }, {})

  const postCode = formFields[clientFieldNames.addressPostcode]
  const country = formFields[clientFieldNames.addressCountry]
  const postCodeValidResponse = validatePostcode(postCode, country)
  if (!postCodeValidResponse.valid) {
    errors[clientFieldNames.addressPostcode] = postCodeValidResponse.message
  }
  return errors
}

const submitForm = async function (form, serviceExternalId, correlationId) {
  form[clientFieldNames.telephoneNumber] = form[clientFieldNames.telephoneNumber].replace(/\s/g, '')

  const serviceUpdateRequest = new ServiceUpdateRequest()
    .replace(validPaths.merchantDetails.name, form[clientFieldNames.name])
    .replace(validPaths.merchantDetails.telephoneNumber, form[clientFieldNames.telephoneNumber])
    .replace(validPaths.merchantDetails.addressLine1, form[clientFieldNames.addressLine1])
    .replace(validPaths.merchantDetails.addressLine2, form[clientFieldNames.addressLine2])
    .replace(validPaths.merchantDetails.addressCity, form[clientFieldNames.addressCity])
    .replace(validPaths.merchantDetails.addressPostcode, form[clientFieldNames.addressPostcode])
    .replace(validPaths.merchantDetails.addressCountry, form[clientFieldNames.addressCountry])

  const payload = serviceUpdateRequest.formatPayload()
  return serviceService.updateService(serviceExternalId, payload, correlationId)
}

const buildErrorsPageData = (errors, form) => {
  return {
    success: false,
    errors: errors,
    merchant_details: {
      name: form[clientFieldNames.name],
      telephone_number: form[clientFieldNames.telephoneNumber],
      email: form[clientFieldNames.email],
      address_line1: form[clientFieldNames.addressLine1],
      address_line2: form[clientFieldNames.addressLine2],
      address_city: form[clientFieldNames.addressCity],
      address_postcode: form[clientFieldNames.addressPostcode],
      address_country: form[clientFieldNames.addressCountry]
    }
  }
}

module.exports = async function (req, res) {
  try {
    const correlationId = lodash.get(req, 'correlationId')
    const serviceExternalId = req.service.externalId

    const form = normaliseForm(req.body)
    const errors = validateForm(form)

    if (lodash.isEmpty(errors)) {
      await submitForm(form, serviceExternalId, correlationId)
      req.flash('generic', 'Organisation details updated')
      res.redirect(formatServicePathsFor(paths.service.merchantDetails.index, serviceExternalId))
    } else {
      const pageData = buildErrorsPageData(errors, form)
      lodash.set(req, 'session.pageData.editMerchantDetails', pageData)
      res.redirect(formatServicePathsFor(paths.service.merchantDetails.edit, serviceExternalId))
    }
  } catch (error) {
    logger.error(`Error submitting organisation details - ${error.stack}`)
    renderErrorView(req, res)
  }
}
