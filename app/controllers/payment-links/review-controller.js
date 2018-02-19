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
    nextPage: undefined,
    change: paths.paymentLinks.createInformation,
    returnToStart: paths.paymentLinks.index
  })
}
