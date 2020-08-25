'use strict'

const lodash = require('lodash')
const paths = require('../../paths')

module.exports = function postReference (req, res, next) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!sessionData) {
    next(new Error('Payment link data not found in session cookie'))
  }

  const type = req.body['reference-type-group']
  const label = req.body['reference-label'].trim()
  const hint = req.body['reference-hint-text'].trim()

  const errors = {}
  if (!type) {
    errors.type = 'Would you like us to create a payment reference number for your users?'
  } else if (type === 'custom' && label === '') {
    errors.label = 'Enter a name for your payment reference'
  }

  if (!lodash.isEmpty(errors)) {
    sessionData.referencePageRecovered = {
      errors,
      type,
      label,
      hint
    }
    return res.redirect(paths.paymentLinks.reference)
  }

  sessionData.paymentReferenceType = type
  sessionData.paymentReferenceLabel = type === 'custom' ? label : ''
  sessionData.paymentReferenceHint = type === 'custom' ? hint : ''

  if (req.body['change'] === 'true') {
    req.flash('generic', 'The details have been updated')
    return res.redirect(paths.paymentLinks.review)
  }

  return res.redirect(paths.paymentLinks.amount)
}
