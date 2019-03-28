'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../../../utils/response')

module.exports = (req, res) => {
  let pageData = lodash.get(req, 'session.pageData.stripeSetup.companyNumberData')
  if (pageData) {
    delete req.session.pageData.stripeSetup.companyNumberData
  } else {
    pageData = {
      errors: {},
      vatNumber: ''
    }
  }

  return response(req, res, 'stripe-setup/vat-number-company-number/company-number', pageData)
}
