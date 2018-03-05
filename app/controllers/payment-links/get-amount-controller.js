'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  const paymentLinkAmount = req.body['payment-amount'] || pageData.paymentLinkAmount || ''

  return response(req, res, 'payment-links/amount', {
    paymentLinkAmount,
    nextPage: paths.paymentLinks.amount,
    returnToStart: paths.paymentLinks.start,
    manage: paths.paymentLinks.manage
  })
}
