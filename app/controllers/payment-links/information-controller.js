'use strict'

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

const PAGE_PARAMS = {
  nextPage: paths.paymentLinks.createReview,
  returnToStart: paths.paymentLinks.index
}

module.exports = (req, res) => response(req, res, 'payment-links/information', PAGE_PARAMS)
