'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local dependencies
const response = require('../../../../utils/response')

module.exports = (req, res) => {
  // initialise pageData
  let pageData = lodash.get(req, 'session.pageData.stripeSetup.vatNumber')
  if (pageData) {
    delete req.session.pageData.stripeSetup.vatNumber
  } else {
    pageData = {
      errors: {},
      vatNumber: ''
    }
  }

  return response.response(req, res, 'stripe-setup/vat-number-company-number/vat-number', pageData)
}
