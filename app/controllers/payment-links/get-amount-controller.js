'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  const paymentLinkAmount = req.body['payment-amount'] || pageData.paymentLinkAmount || ''
  const paymentAmountType = req.body['amount-type-group'] || pageData.paymentAmountType || ''

  return response(req, res, 'payment-links/amount', {
    paymentLinkAmount,
    paymentAmountType,
    nextPage: paths.paymentLinks.amount,
    returnToStart: paths.paymentLinks.start,
    manage: paths.paymentLinks.manage,
    isWelsh: pageData.isWelsh
  })
}
