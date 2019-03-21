const lodash = require('lodash')
const ukPostcode = require('uk-postcode')

const responses = require('../../utils/response')
const paths = require('../../paths')
const serviceService = require('../../services/service_service')
const { isPhoneNumber, isValidEmail } = require('../../browsered/field-validation-checks')
const formattedPathFor = require('../../utils/replace_params_in_path')

const MERCHANT_NAME = 'merchant-name'
const TELEPHONE_NUMBER = 'telephone-number'
const ADDRESS_LINE1 = 'address-line1'
const ADDRESS_LINE2 = 'address-line2'
const ADDRESS_CITY = 'address-city'
const ADDRESS_POSTCODE = 'address-postcode'
const ADDRESS_COUNTRY = 'address-country'
const MERCHANT_EMAIL = 'merchant-email'

const trimField = (key, store) => lodash.get(store, key, '').trim()

module.exports = (req, res) => {
  const correlationId = lodash.get(req, 'correlationId')
  const externalServiceId = req.service.externalId
  const hasDirectDebitGatewayAccount = lodash.get(req, 'service.hasDirectDebitGatewayAccount') || lodash.get(req, 'service.hasCardAndDirectDebitGatewayAccount')

  const fields = [
    MERCHANT_NAME,
    TELEPHONE_NUMBER,
    ADDRESS_LINE1,
    ADDRESS_LINE2,
    ADDRESS_CITY,
    ADDRESS_POSTCODE,
    ADDRESS_COUNTRY,
    MERCHANT_EMAIL
  ]
  const formFields = fields.reduce((form, field) => {
    form[field] = trimField(field, req.body)
    return form
  }, {})

  const reqMerchantDetails = {
    name: formFields[MERCHANT_NAME],
    telephone_number: formFields[TELEPHONE_NUMBER].replace(/\s/g, ''),
    email: formFields[MERCHANT_EMAIL],
    address_line1: formFields[ADDRESS_LINE1],
    address_line2: formFields[ADDRESS_LINE2],
    address_city: formFields[ADDRESS_CITY],
    address_postcode: formFields[ADDRESS_POSTCODE],
    address_country: formFields[ADDRESS_COUNTRY]
  }
  const errors = isValidForm(formFields, hasDirectDebitGatewayAccount)
  if (lodash.isEmpty(errors)) {
    return serviceService.updateMerchantDetails(externalServiceId, reqMerchantDetails, correlationId)
      .then(() => {
        req.flash('generic', `<h2>Organisation details updated</h2>`)
        res.redirect(formattedPathFor(paths.merchantDetails.index, externalServiceId))
      })
      .catch(err => {
        responses.renderErrorView(req, res, err.message)
      })
  } else {
    lodash.set(req, 'session.pageData.editMerchantDetails', {
      success: false,
      errors: errors,
      merchant_details: reqMerchantDetails,
      has_direct_debit_gateway_account: hasDirectDebitGatewayAccount,
      externalServiceId
    })
    res.redirect(formattedPathFor(paths.merchantDetails.edit, externalServiceId))
  }
}

function validateNotEmpty (formFields, fieldNames) {
  let errors = {}
  fieldNames.forEach(fieldName => {
    let field = formFields[fieldName]
    if (!field || typeof field !== 'string') {
      errors[fieldName] = true
    }
  })
  return errors
}

function isValidPostcode (postcode, countryCode) {
  return !(countryCode === 'GB' && !ukPostcode.fromString(postcode).isComplete())
}

function isValidForm (formFields, isDirectDebitForm) {
  const mandatoryFields = [MERCHANT_NAME, ADDRESS_LINE1, ADDRESS_CITY, ADDRESS_POSTCODE, ADDRESS_COUNTRY]
  if (isDirectDebitForm) {
    mandatoryFields.push(TELEPHONE_NUMBER)
    mandatoryFields.push(MERCHANT_EMAIL)
  }

  const errors = validateNotEmpty(formFields, mandatoryFields)

  if (isDirectDebitForm && formFields[TELEPHONE_NUMBER] && (isPhoneNumber(formFields[TELEPHONE_NUMBER]) !== false)) {
    errors[TELEPHONE_NUMBER] = true
  }
  if (isDirectDebitForm && formFields[MERCHANT_EMAIL] && (isValidEmail(formFields[MERCHANT_EMAIL]) !== false)) {
    errors[MERCHANT_EMAIL] = true
  }

  if (!isValidPostcode(formFields[ADDRESS_POSTCODE], formFields[ADDRESS_COUNTRY])) {
    errors[ADDRESS_POSTCODE] = true
  }

  return errors
}
