'use strict'

const lodash = require('lodash')

const { response } = require('../../../../utils/response')

module.exports = (req, res) => {
  let pageData = lodash.get(req, 'session.pageData.stripeSetup.vatNumberData')
  if (pageData) {
    delete req.session.pageData.stripeSetup.vatNumberData
  } else {
    pageData = {
      errors: {},
      vatNumber: ''
    }
  }

  return response(req, res, 'stripe-setup/vat-number-company-number/vat-number', pageData)
}
