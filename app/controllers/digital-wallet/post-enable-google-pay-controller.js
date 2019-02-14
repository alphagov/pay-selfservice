'use strict'

// Local dependencies
const paths = require('../../paths')

module.exports = (req, res) => {
  return res.redirect(paths.digitalWallet.summary)
}
