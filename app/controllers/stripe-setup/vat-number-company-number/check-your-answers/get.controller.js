'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../../../utils/response')

module.exports = (req, res) => {
  const vatNumberPageData = lodash.get(req, 'session.pageData.stripeSetup.vatNumberData')
  const companyNumberPageData = lodash.get(req, 'session.pageData.stripeSetup.companyNumberData')
  const pageData = {
    vatNumber: vatNumberPageData.vatNumber,
    companyNumber: 'None'
  }
  if (companyNumberPageData && companyNumberPageData.companyNumber) {
    pageData.companyNumber = companyNumberPageData.companyNumber
  }

  return response(req, res, 'stripe-setup/vat-number-company-number/check-your-answers', pageData)
}
