'use strict'

// Local dependencies
const paths = require('../../paths')

module.exports = (req, res) => {
  console.log('here we are')
  return res.redirect(paths.digitalWallet.summary)
}
