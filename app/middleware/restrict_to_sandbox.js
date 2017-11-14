'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {renderErrorView} = require('../utils/response')

module.exports = (req, res, next) => {
  const provider = lodash.get(req, 'account.payment_provider', '')
  if (provider.toLowerCase() !== 'sandbox') {
    renderErrorView(req, res, 'This page is only available on Sandbox accounts', 403)
  } else {
    next()
  }
}
