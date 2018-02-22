'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

const PAGE_PARAMS = {
  nextPage: paths.paymentLinks.information,
  returnToStart: paths.paymentLinks.start,
  manage: paths.paymentLinks.manage
}

module.exports = (req, res) => {
  lodash.set(req, 'session.pageData.createPaymentLink', {})

  return response(req, res, 'payment-links/index', PAGE_PARAMS)
}
