'use strict'

const lodash = require('lodash')

const { response } = require('../../../../utils/response')
const { stripeSetup } = require('../../../../paths')

module.exports = (req, res) => {
  if (lodash.isEmpty(lodash.get(req, 'session.pageData.stripeSetup.vatNumberData.vatNumber'))) {
    return res.redirect(303, stripeSetup.vatNumberCompanyNumber)
  }

  let pageData = lodash.get(req, 'session.pageData.stripeSetup.companyNumberData')
  if (pageData) {
    delete req.session.pageData.stripeSetup.companyNumberData
  } else {
    pageData = {
      errors: {},
      companyNumberDeclaration: '',
      companyNumber: ''
    }
  }

  return response(req, res, 'stripe-setup/vat-number-company-number/company-number', pageData)
}
