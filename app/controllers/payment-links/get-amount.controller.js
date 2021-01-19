'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

module.exports = function showAmountPage (req, res, next) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!sessionData) {
    return next(new Error('Payment link data not found in session cookie'))
  }

  const recovered = sessionData.amountPageRecovered || {}
  delete sessionData.amountPageRecovered

  const paymentLinkAmount = recovered.amount || sessionData.paymentLinkAmount || ''
  const paymentAmountType = recovered.type || sessionData.paymentAmountType || ''

  return response(req, res, 'payment-links/amount', {
    paymentLinkAmount,
    paymentAmountType,
    nextPage: formatAccountPathsFor(paths.account.paymentLinks.amount, req.account && req.account.external_id),
    returnToStart: formatAccountPathsFor(paths.account.paymentLinks.start, req.account && req.account.external_id),
    manage: formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id),
    isWelsh: sessionData.isWelsh,
    errors: recovered.errors
  })
}
