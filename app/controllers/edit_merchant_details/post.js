const lodash = require('lodash')
const ukPostcode = require('uk-postcode')

const responses = require('../../utils/response')
const paths = require('../../paths')
const serviceService = require('../../services/service_service')

const MERCHANT_NAME = 'merchant-name'
const ADDRESS_LINE1 = 'address-line1'
const ADDRESS_LINE2 = 'address-line2'
const ADDRESS_CITY = 'address-city'
const ADDRESS_POSTCODE = 'address-postcode'
const ADDRESS_COUNTRY = 'address-country'

exports.post = (req, res) => {
  const correlationId = lodash.get(req, 'correlationId')
  const serviceExternalId = lodash.get(req, 'service.externalId')
  const reqMerchantDetails = {
    name: req.body[MERCHANT_NAME],
    address_line1: req.body[ADDRESS_LINE1],
    address_line2: req.body[ADDRESS_LINE2],
    address_city: req.body[ADDRESS_CITY],
    address_postcode: req.body[ADDRESS_POSTCODE],
    address_country: req.body[ADDRESS_COUNTRY]
  }
  const errors = isValidForm(req)
  if (lodash.isEmpty(errors)) {
    return serviceService.updateMerchantDetails(serviceExternalId, reqMerchantDetails, correlationId)
      .then(() => {
        lodash.set(req, 'session.pageData.editMerchantDetails', {
          success: true,
          merchant_details: reqMerchantDetails
        })
        res.redirect(paths.merchantDetails.index)
      })
      .catch(err => {
        responses.renderErrorView(req, res, err.message)
      })
  } else {
    lodash.set(req, 'session.pageData.editMerchantDetails', {
      success: false,
      errors: errors,
      merchant_details: reqMerchantDetails
    })
    res.redirect(paths.merchantDetails.index)
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

function isValidForm (req) {
  const errors = validateNotEmpty(req, [MERCHANT_NAME, ADDRESS_LINE1, ADDRESS_CITY, ADDRESS_POSTCODE, ADDRESS_COUNTRY])
  if (!isValidPostcode(req.body[ADDRESS_POSTCODE], req.body[ADDRESS_COUNTRY])) {
    errors[ADDRESS_POSTCODE] = true
  }
  return errors
}
