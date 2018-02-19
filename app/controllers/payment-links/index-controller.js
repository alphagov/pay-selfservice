'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

const PAGE_PARAMS = {
  nextPage: paths.paymentLinks.createInformation
}

module.exports = (req, res) => {
  lodash.set(req, 'session.pageData.createPaymentLink', {})

  return response(req, res, 'payment-links/index', PAGE_PARAMS)
}
