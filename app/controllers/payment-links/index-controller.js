'use strict'

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

const PAGE_PARAMS = {
  nextPage: paths.paymentLinks.createInformation
}

module.exports = (req, res) => response(req, res, 'payment-links/index', PAGE_PARAMS)
