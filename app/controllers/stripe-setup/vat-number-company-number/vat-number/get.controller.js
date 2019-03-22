'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local dependencies
const response = require('../../../../utils/response')

module.exports = (req, res) => {
  // initialise pageData
  let pageData = {
    errors: lodash.get(req, 'session.stripeSetup.vatNumber.errors'),
    vatNumber: lodash.get(req, 'session.stripeSetup.vatNumber.vatNumber', '')
  }

  return response.response(req, res, 'stripe-setup/vat-number-company-number/vat-number', pageData)
}
