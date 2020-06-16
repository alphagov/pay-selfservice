'use strict'

const lodash = require('lodash')

const paths = require('../../paths')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  let updatedPageData = lodash.cloneDeep(pageData)
  const paymentReferenceType = req.body['reference-type-group']
  const paymentReferenceLabel = req.body['reference-label'].trim()
  const paymentReferenceHint = req.body['reference-hint-text'].trim()

  if (!paymentReferenceType) {
    req.flash('genericError', `<h2>There was a problem with the details you gave for:</h2><ul class="govuk-list govuk-error-summary__list"><li><a href="#standard-or-custom-ref">Would you like us to create a payment reference number for your users?</a></li></ul>`)
    req.flash('errorType', `paymentReferenceType`)
    return res.redirect(paths.paymentLinks.reference)
  }

  if (paymentReferenceType === 'custom') {
    if (paymentReferenceLabel === '') {
      req.flash('genericError', `<h2>There was a problem with the details you gave for:</h2><ul class="govuk-list govuk-error-summary__list"><li><a href="#reference-label">Name of your payment reference number</a></li></ul>`)
      req.flash('errorType', `label`)
      return res.redirect(paths.paymentLinks.reference)
    }
  }

  updatedPageData.paymentReferenceType = paymentReferenceType
  updatedPageData.paymentReferenceLabel = paymentReferenceType === 'custom' ? paymentReferenceLabel : ''
  updatedPageData.paymentReferenceHint = paymentReferenceType === 'custom' ? paymentReferenceHint : ''
  lodash.set(req, 'session.pageData.createPaymentLink', updatedPageData)

  if (req.body['change'] === 'true') {
    req.flash('generic', `<h2>The details have been updated</h2>`)
    return res.redirect(paths.paymentLinks.review)
  }

  return res.redirect(paths.paymentLinks.amount)
}
