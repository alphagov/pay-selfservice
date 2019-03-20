'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { requestToGoLive } = require('../../../paths')
const {
  validateMandatoryField, validateOptionalField, validatePostcode, validatePhoneNumber
} = require('../../../utils/validation/server-side-form-validations')
const { renderErrorView } = require('../../../utils/response')

const ADDRESS_LINE1_FIELD = 'address-line1'
const ADDRESS_LINE2_FIELD = 'address-line2'
const ADDRESS_CITY_FIELD = 'address-city'
const ADDRESS_COUNTRY_FIELD = 'address-country'
const ADDRESS_POSTCODE_FIELD = 'address-postcode'
const TELEPHONE_NUMBER_FIELD = 'telephone-number'

const validationRules = [
  {
    field: ADDRESS_LINE1_FIELD,
    validator: validateMandatoryField,
    maxLength: 200
  },
  {
    field: ADDRESS_LINE2_FIELD,
    validator: validateOptionalField,
    maxLength: 200
  },
  {
    field: ADDRESS_CITY_FIELD,
    validator: validateMandatoryField,
    maxLength: 100
  },
  {
    field: ADDRESS_COUNTRY_FIELD,
    validator: validateMandatoryField,
    maxLength: 2
  },
  {
    field: TELEPHONE_NUMBER_FIELD,
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

  const postCode = formFields[ADDRESS_POSTCODE_FIELD]
  const country = formFields[ADDRESS_COUNTRY_FIELD]
  const postCodeValidResponse = validatePostcode(postCode, country)
  if (!postCodeValidResponse.valid) {
    errors[ADDRESS_POSTCODE_FIELD] = postCodeValidResponse.message
  }
  return errors
}

module.exports = (req, res) => {
  const fields = [
    ADDRESS_LINE1_FIELD,
    ADDRESS_LINE2_FIELD,
    ADDRESS_CITY_FIELD,
    ADDRESS_COUNTRY_FIELD,
    ADDRESS_POSTCODE_FIELD,
    TELEPHONE_NUMBER_FIELD
  ]
  const formFields = fields.reduce((form, field) => {
    form[field] = trimField(field, req.body)
    return form
  }, {})

  const errors = validate(formFields)

  if (lodash.isEmpty(errors)) {
    // TODO: handle submission
    renderErrorView(req, res)
  } else {
    lodash.set(req, 'session.pageData.requestToGoLive.organisationAddress', {
      success: false,
      errors: errors,
      address_line1: formFields[ADDRESS_LINE1_FIELD],
      address_line2: formFields[ADDRESS_LINE2_FIELD],
      address_city: formFields[ADDRESS_CITY_FIELD],
      address_postcode: formFields[ADDRESS_POSTCODE_FIELD],
      address_country: formFields[ADDRESS_COUNTRY_FIELD],
      telephone_number: formFields[TELEPHONE_NUMBER_FIELD]
    })
    return res.redirect(303, requestToGoLive.organisationAddress.replace(':externalServiceId', req.service.externalId))
  }
}
