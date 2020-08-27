'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')
const formattedPathFor = require('../../utils/replace-params-in-path')
const { safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')

module.exports = function postEditAmount (req, res) {
  const { productExternalId } = req.params
  
  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData || sessionData.externalId != productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    return res.redirect(paths.paymentLinks.manage)
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
    return res.redirect(formattedPathFor(paths.paymentLinks.editAmount, productExternalId))
  }

  sessionData.price = amountInPence
  lodash.set(req, 'session.editPaymentLinkData', sessionData)

  return res.redirect(formattedPathFor(paths.paymentLinks.edit, productExternalId))
}
