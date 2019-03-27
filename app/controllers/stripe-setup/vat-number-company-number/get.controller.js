'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local dependencies
const { stripeSetup } = require('../../../paths')

module.exports = (req, res) => {
  const stripeSetupPageData = lodash.get(req, 'session.pageData.stripeSetup')
  if (!stripeSetupPageData) {
    return res.redirect(303, stripeSetup.vatNumber)
  }

  if (stripeSetupPageData.vatNumberData && stripeSetupPageData.companyNumberData) {
    return res.redirect(303, stripeSetup.checkYourAnswers)
  } else if (stripeSetupPageData.vatNumberData) {
    return res.redirect(303, stripeSetup.companyNumber)
  }
  return res.redirect(303, stripeSetup.vatNumber)
}
