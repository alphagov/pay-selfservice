'use strict'

// Local dependencies
const paths = require('../../../../paths')

module.exports = (req, res) => {
  delete req.session.pageData.stripeSetup.vatNumberData
  delete req.session.pageData.stripeSetup.companyNumberData
  return res.redirect(303, paths.dashboard.index)
}
