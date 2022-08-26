'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')

module.exports = (req, res) => {
  lodash.set(req, 'session.pageData.createPaymentLink', {})

  return response(req, res, 'payment-links/index', {})
}
