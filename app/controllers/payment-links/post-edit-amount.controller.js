'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')

module.exports = function postEditAmount (req, res) {
  const { productExternalId } = req.params

  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData || sessionData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
  }

  const type = req.body['amount-type-group']
  const amount = req.body['payment-amount']

  let amountInPence = ''
  const errors = {}
  if (!type) {
    errors.type = 'Is the payment for a fixed amount?'
  } else if (type === 'fixed') {
    amountInPence = safeConvertPoundsStringToPence(amount)
    if (amount === '' || amountInPence === null) {
      errors.amount = 'Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”'
    }
  }

  if (!lodash.isEmpty(errors)) {
    sessionData.amountPageRecovered = {
      errors,
      type,
      amount: ''
    }
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.editAmount, req.account && req.account.external_id, productExternalId))
  }

  sessionData.price = amountInPence
  lodash.set(req, 'session.editPaymentLinkData', sessionData)

  return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.edit, req.account && req.account.external_id, productExternalId))
}
