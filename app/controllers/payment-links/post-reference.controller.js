'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  let updatedPageData = lodash.cloneDeep(pageData)
  const paymentReferenceType = req.body['reference-type-group']
  const paymentReferenceLabel = req.body['reference-label'].trim()
  const paymentReferenceHint = req.body['reference-hint-text'].trim()

  if (!paymentReferenceType) {
    req.flash('error', 'Would you like us to create a payment reference number for your users?')
    req.flash('errorType', `paymentReferenceType`)
    return res.redirect(paths.paymentLinks.reference)
  }

  if (paymentReferenceType === 'custom') {
    if (paymentReferenceLabel === '') {
      req.flash('error', 'Enter a name for your payment reference')
      req.flash('errorType', `label`)
      return res.redirect(paths.paymentLinks.reference)
    }
  }

  updatedPageData.paymentReferenceType = paymentReferenceType
  updatedPageData.paymentReferenceLabel = paymentReferenceType === 'custom' ? paymentReferenceLabel : ''
  updatedPageData.paymentReferenceHint = paymentReferenceType === 'custom' ? paymentReferenceHint : ''
  lodash.set(req, 'session.pageData.createPaymentLink', updatedPageData)

  if (req.body['change'] === 'true') {
    req.flash('generic', 'The details have been updated')
    return res.redirect(paths.paymentLinks.review)
  }

  return res.redirect(paths.paymentLinks.amount)
}
