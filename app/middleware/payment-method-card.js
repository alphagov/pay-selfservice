'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { renderErrorView } = require('../utils/response')

module.exports = (req, res, next) => {
  const paymentMethod = lodash.get(req, 'account.paymentMethod', 'card')
  if (paymentMethod === 'card') {
    next()
  } else {
    renderErrorView(req, res, 'This page is only available to card accounts not direct debit accounts.', 403)
  }
}
