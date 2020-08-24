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
    req.flash('error', 'Enter a title')
    return res.redirect(formattedPathFor(paths.paymentLinks.editInformation, req.params.productExternalId))
  }

  return res.redirect(formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId))
}
