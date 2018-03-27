'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  const paymentLinkTitle = req.body['payment-description'] || pageData.paymentLinkTitle || ''
  const paymentLinkDescription = req.body['payment-amount'] || pageData.paymentLinkDescription || ''
  const change = lodash.get(req, 'query.field', {})
  const friendlyURL = process.env.PRODUCTS_FRIENDLY_BASE_URI

  return response(req, res, 'payment-links/information', {
    change,
    friendlyURL,
    paymentLinkTitle,
    paymentLinkDescription,
    nextPage: paths.paymentLinks.information,
    returnToStart: paths.paymentLinks.start,
    manage: paths.paymentLinks.manage
  })
}
