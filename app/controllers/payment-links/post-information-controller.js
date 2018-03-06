'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  let updatedPageData = lodash.cloneDeep(pageData)

  updatedPageData.paymentLinkTitle = req.body['payment-link-title']
  updatedPageData.paymentLinkDescription = req.body['payment-link-description']
  lodash.set(req, 'session.pageData.createPaymentLink', updatedPageData)

  if (updatedPageData.paymentLinkTitle === '') {
    req.flash('genericError', `<h2>There was a problem with the details you gave for:</h2><ul class="error-summary-list"><li><a href="#payment-link-title">Title</a></li></ul>`)
    return res.redirect(paths.paymentLinks.information)
  }

  if (!lodash.isEmpty(pageData) && !lodash.isEqual(pageData, updatedPageData)) {
    req.flash('generic', `<h2>The details have been updated</h2>`)
  }

  if (req.body['change'] === 'true') {
    return res.redirect(paths.paymentLinks.review)
  }

  return res.redirect(paths.paymentLinks.amount)
}
