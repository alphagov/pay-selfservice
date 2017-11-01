'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local Dependencies
const responses = require('../utils/response')
const paths = require('../paths')
const serviceService = require('../services/service_service')
const ukPostcode = require('uk-postcode')
const countries = require('../services/countries.js')

const merchantNameField = 'merchant-name'
const addressLine1Field = 'address-line1'
const addressLine2Field = 'address-line2'
const addressCityField = 'address-city'
const addressPostcodeField = 'address-postcode'
const addressCountryField = 'address-country'

exports.get = (req, res) => {
  const merchantDetails = lodash.get(req, 'service.merchantDetails')
  let pageData = lodash.get(req, 'session.pageData.editMerchantDetails')
  if (pageData) {
    delete req.session.pageData.editMerchantDetails
  } else {
    pageData = {}
  }
  pageData.merchant_details = merchantDetails
  pageData.countries = countries.retrieveCountries(lodash.get(merchantDetails, 'address_country'))
  return responses.response(req, res, 'merchant_details/edit_merchant_details', pageData)
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
  const errors = validateNotEmpty(req, [merchantNameField, addressLine1Field, addressCityField, addressPostcodeField, addressCountryField])
  if (!isValidPostcode(req.body[addressPostcodeField], req.body[addressCountryField])) {
    errors[addressPostcodeField] = true
  }
  return errors
}

exports.post = (req, res) => {
  const correlationId = lodash.get(req, 'correlationId')
  const serviceExternalId = lodash.get(req, 'service.externalId')

  const requestPayload = {
    name: req.body[merchantNameField],
    address_line1: req.body[addressLine1Field],
    address_city: req.body[addressCityField],
    address_postcode: req.body[addressPostcodeField],
    address_country: req.body[addressCountryField]
  }
  if (req.body[addressLine2Field]) {
    requestPayload.address_line2 = req.body[addressLine2Field]
  }
  const errors = isValidForm(req)
  if (lodash.isEmpty(errors)) {
    return serviceService.updateMerchantDetails(serviceExternalId, requestPayload, correlationId)
    .then(() => {
      lodash.set(req, 'session.pageData.editMerchantDetails', {
        success: true
      })
      res.redirect(paths.merchantDetails.index)
    })
    .catch(err => {
      responses.renderErrorView(req, res, err)
    })
  } else {
    lodash.set(req, 'session.pageData.editMerchantDetails', {
      success: false,
      errors: errors
    })
    res.redirect(paths.merchantDetails.index)
  }
}
