'use strict'


// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

const PAGE_PARAMS = {
  returnToStart: paths.paymentLinks.index,
  manage: paths.paymentLinks.manage
}

module.exports = (req, res) => {
  return response(req, res, 'payment-links/manage', PAGE_PARAMS)
}
