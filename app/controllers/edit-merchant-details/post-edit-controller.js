'use strict'

const lodash = require('lodash')

const logger = require('../../utils/logger')(__filename)
const { renderErrorView } = require('../../utils/response')
const paths = require('../../paths')
const serviceService = require('../../services/service.service')
const formattedPathFor = require('../../utils/replace-params-in-path')
const { validPaths, ServiceUpdateRequest } = require('../../models/ServiceUpdateRequest.class')
const {
  validateMandatoryField, validateOptionalField, validatePostcode, validatePhoneNumber, validateEmail
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

const directDebitAccountValidationRules = [
  {
    field: clientFieldNames.email,
    validator: validateEmail
  },
  ...validationRules
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

const validateForm = (formFields, hasDirectDebitGatewayAccount) => {
  const rules = hasDirectDebitGatewayAccount ? directDebitAccountValidationRules : validationRules

  const errors = rules.reduce((errors, validationRule) => {
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

const submitForm = async function (form, serviceExternalId, correlationId, hasDirectDebitGatewayAccount) {
  form[clientFieldNames.telephoneNumber] = form[clientFieldNames.telephoneNumber].replace(/\s/g, '')

  const serviceUpdateRequest = new ServiceUpdateRequest()
    .replace(validPaths.merchantDetails.name, form[clientFieldNames.name])
    .replace(validPaths.merchantDetails.telephoneNumber, form[clientFieldNames.telephoneNumber])
    .replace(validPaths.merchantDetails.addressLine1, form[clientFieldNames.addressLine1])
    .replace(validPaths.merchantDetails.addressLine2, form[clientFieldNames.addressLine2])
    .replace(validPaths.merchantDetails.addressCity, form[clientFieldNames.addressCity])
    .replace(validPaths.merchantDetails.addressPostcode, form[clientFieldNames.addressPostcode])
    .replace(validPaths.merchantDetails.addressCountry, form[clientFieldNames.addressCountry])

  if (hasDirectDebitGatewayAccount) {
    serviceUpdateRequest
      .replace(validPaths.merchantDetails.email, form[clientFieldNames.email])
  }

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
    const hasDirectDebitGatewayAccount = lodash.get(req, 'service.hasDirectDebitGatewayAccount') || lodash.get(req, 'service.hasCardAndDirectDebitGatewayAccount')

    const form = normaliseForm(req.body)
    const errors = validateForm(form, hasDirectDebitGatewayAccount)

    if (lodash.isEmpty(errors)) {
      await submitForm(form, serviceExternalId, correlationId, hasDirectDebitGatewayAccount)
      req.flash('generic', 'Organisation details updated')
      res.redirect(formattedPathFor(paths.merchantDetails.index, serviceExternalId))
    } else {
      const pageData = buildErrorsPageData(errors, form)
      lodash.set(req, 'session.pageData.editMerchantDetails', pageData)
      res.redirect(formattedPathFor(paths.merchantDetails.edit, serviceExternalId))
    }
  } catch (error) {
    logger.error(`Error submitting organisation details - ${error.stack}`)
    renderErrorView(req, res)
  }
}
