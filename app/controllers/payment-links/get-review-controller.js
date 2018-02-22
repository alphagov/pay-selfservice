'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})

  return response(req, res, 'payment-links/review', {
    paymentLinkTitle: pageData.paymentLinkTitle,
    paymentLinkDescription: pageData.paymentLinkDescription,
    nextPage: paths.paymentLinks.review,
    change: paths.paymentLinks.information,
    returnToStart: paths.paymentLinks.start,
    manage: paths.paymentLinks.manage
  })
}
