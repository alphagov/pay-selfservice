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

  if (lodash.isEmpty(lodash.get(req, 'session.pageData.stripeSetup.vatNumberData.vatNumber'))) {
    return res.redirect(303, stripeSetup.vatNumber)
  } else if (lodash.isEmpty(lodash.get(req, 'session.pageData.stripeSetup.companyNumberData.companyNumberMode'))) {
    return res.redirect(303, stripeSetup.companyNumber)
  }

  return res.redirect(303, stripeSetup.checkYourAnswers)
}
