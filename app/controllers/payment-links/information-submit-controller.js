'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')

module.exports = (req, res) => {
  const paymentLinkTitle = req.body['payment-link-title']
  const paymentLinkDescription = req.body['payment-link-description']
  lodash.set(req, 'session.pageData.createPaymentLink', {paymentLinkTitle, paymentLinkDescription})

  return res.redirect(paths.paymentLinks.createReview)
}
