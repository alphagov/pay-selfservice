'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../../../utils/response')
const { stripeSetup } = require('../../../../paths')

module.exports = (req, res) => {
  const vatNumber = lodash.get(req, 'session.pageData.stripeSetup.vatNumberData.vatNumber')
  const companyNumberMode = lodash.get(req, 'session.pageData.stripeSetup.companyNumberData.companyNumberMode')
  const companyNumber = lodash.get(req, 'session.pageData.stripeSetup.companyNumberData.companyNumber')

  if (!vatNumber || !companyNumberMode) {
    return res.redirect(303, stripeSetup.vatNumberCompanyNumber)
  }

  const pageData = {
    vatNumber: vatNumber,
    companyNumber: companyNumber || 'None'
  }

  return response(req, res, 'stripe-setup/vat-number-company-number/check-your-answers', pageData)
}
