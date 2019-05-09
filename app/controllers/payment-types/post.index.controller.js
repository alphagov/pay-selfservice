'use strict'

// Local dependencies
const paths = require('../../paths')

module.exports = (req, res) => {
  res.redirect(paths.paymentTypes.index)
}
