'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../utils/response.js')

module.exports = (req, res) => {
  const friendlyURL = process.env.PRODUCTS_FRIENDLY_BASE_URI
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  const productNamePath = pageData.productNamePath || ''

  return response(req, res, 'payment-links/web-address', {
    friendlyURL,
    productNamePath
  })
}
