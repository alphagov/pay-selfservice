const lodash = require('lodash')
const ukPostcode = require('uk-postcode')

const responses = require('../../utils/response')
const paths = require('../../paths')
const serviceService = require('../../services/service_service')
const {isPhoneNumber, isValidEmail} = require('../../browsered/field-validation-checks')
const formattedPathFor = require('../../utils/replace_params_in_path')

const MERCHANT_NAME = 'merchant-name'
const TELEPHONE_NUMBER = 'telephone-number'
const ADDRESS_LINE1 = 'address-line1'
const ADDRESS_LINE2 = 'address-line2'
const ADDRESS_CITY = 'address-city'
const ADDRESS_POSTCODE = 'address-postcode'
const ADDRESS_COUNTRY = 'address-country'
const MERCHANT_EMAIL = 'merchant-email'

module.exports = (req, res) => {
  console.log(JSON.stringify(req.file))
  const correlationId = lodash.get(req, 'correlationId')
  const externalServiceId = req.service.externalId
  const hasDirectDebitGatewayAccount = lodash.get(req, 'service.hasDirectDebitGatewayAccount') || lodash.get(req, 'service.hasCardAndDirectDebitGatewayAccount')
  const reqMerchantDetails = {
    name: req.body[MERCHANT_NAME],
    telephone_number: req.body[TELEPHONE_NUMBER] ? req.body[TELEPHONE_NUMBER].replace(/\s/g, '') : req.body[TELEPHONE_NUMBER],
    email: req.body[MERCHANT_EMAIL],
    address_line1: req.body[ADDRESS_LINE1],
    address_line2: req.body[ADDRESS_LINE2],
    address_city: req.body[ADDRESS_CITY],
    address_postcode: req.body[ADDRESS_POSTCODE],
    address_country: req.body[ADDRESS_COUNTRY]
  }
  const errors = isValidForm(req, hasDirectDebitGatewayAccount)
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

function validateNotEmpty (req, fieldNames) {
  let errors = {}
  fieldNames.forEach(fieldName => {
    let field = req.body[fieldName]
    if (!field || typeof field !== 'string') {
      errors[fieldName] = true
    }
  })
  return errors
}

function isValidPostcode (postcode, countryCode) {
  return !(countryCode === 'GB' && !ukPostcode.fromString(postcode).isComplete())
}

function isValidForm (req, isDirectDebitForm) {
  const mandatoryFields = [MERCHANT_NAME, ADDRESS_LINE1, ADDRESS_CITY, ADDRESS_POSTCODE, ADDRESS_COUNTRY]
  if (isDirectDebitForm) {
    mandatoryFields.push(TELEPHONE_NUMBER)
    mandatoryFields.push(MERCHANT_EMAIL)
  }

  const errors = validateNotEmpty(req, mandatoryFields)

  if (isDirectDebitForm && req.body[TELEPHONE_NUMBER] && (isPhoneNumber(req.body[TELEPHONE_NUMBER]) !== false)) {
    errors[TELEPHONE_NUMBER] = true
  }
  if (isDirectDebitForm && req.body[MERCHANT_EMAIL] && (isValidEmail(req.body[MERCHANT_EMAIL]) !== false)) {
    errors[MERCHANT_EMAIL] = true
  }

  if (!isValidPostcode(req.body[ADDRESS_POSTCODE], req.body[ADDRESS_COUNTRY])) {
    errors[ADDRESS_POSTCODE] = true
  }

  return errors
}
