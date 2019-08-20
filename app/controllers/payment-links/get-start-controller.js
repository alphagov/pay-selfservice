'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../utils/response.js')

module.exports = (req, res) => {
  lodash.set(req, 'session.pageData.createPaymentLink', {})

  return response(req, res, 'payment-links/index', {})
}
