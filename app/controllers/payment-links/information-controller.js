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

  return response(req, res, 'payment-links/information', {
    change,
    paymentLinkTitle,
    paymentLinkDescription,
    nextPage: paths.paymentLinks.createReview,
    returnToStart: paths.paymentLinks.index
  })
}
