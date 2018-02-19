'use strict'

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

const PAGE_PARAMS = {
  nextPage: undefined,
  change: paths.paymentLinks.createInformation,
  returnToStart: paths.paymentLinks.index
}

module.exports = (req, res) => response(req, res, 'payment-links/review', PAGE_PARAMS)
