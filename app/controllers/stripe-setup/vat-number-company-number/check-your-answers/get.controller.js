'use strict'

const lodash = require('lodash')

const { response } = require('../../../../utils/response')
const { stripeSetup } = require('../../../../paths')

module.exports = (req, res) => {
  const vatNumber = lodash.get(req, 'session.pageData.stripeSetup.vatNumberData.vatNumber')
  const companyNumberDeclaration = lodash.get(req, 'session.pageData.stripeSetup.companyNumberData.companyNumberDeclaration')
  const companyNumber = lodash.get(req, 'session.pageData.stripeSetup.companyNumberData.companyNumber')

  if (!vatNumber || !companyNumberDeclaration) {
    return res.redirect(303, stripeSetup.vatNumberCompanyNumber)
  }

  const pageData = {
    vatNumber: vatNumber,
    companyNumber: companyNumber || 'None'
  }

  return response(req, res, 'stripe-setup/vat-number-company-number/check-your-answers', pageData)
}
