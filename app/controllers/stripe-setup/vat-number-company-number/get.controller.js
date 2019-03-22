'use strict'

// Local dependencies
const { stripeSetup } = require('../../../paths')

module.exports = (req, res) => {
  return res.redirect(303, stripeSetup.vatNumber)
}
