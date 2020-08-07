'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')
const formattedPathFor = require('../../utils/replace-params-in-path')

module.exports = (req, res) => {
  const editData = lodash.get(req, 'session.editPaymentLinkData', {})

  editData.name = req.body['payment-link-title']
  editData.description = req.body['payment-link-description']
  lodash.set(req, 'session.editPaymentLinkData', editData)

  if (editData.name === '') {
    req.flash('genericError', `<h2>There was a problem with the details you gave for:</h2><ul class="error-summary-list"><li><a href="#payment-link-title">Title</a></li></ul>`)
    return res.redirect(formattedPathFor(paths.paymentLinks.editInformation, req.params.productExternalId))
  }

  return res.redirect(formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId))
}
