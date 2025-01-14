'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')

module.exports = function showWebAddressPage (req, res, next) {
  const friendlyURL = process.env.PRODUCTS_FRIENDLY_BASE_URI

  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!sessionData) {
    next(new Error('Payment link data not found in session cookie'))
  }

  const recovered = sessionData.webAddressPageRecovered || {}
  delete sessionData.webAddressPageRecovered

  const productNamePath = recovered.paymentLinkURLPath || sessionData.productNamePath || ''

  return response(req, res, 'payment-links/web-address', {
    friendlyURL,
    productNamePath,
    errors: recovered.errors
  })
}
