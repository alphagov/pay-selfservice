'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')
const formattedPathFor = require('../../utils/replace-params-in-path')

module.exports = function postEditInformation (req, res, next) {
  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData) {
    return next(new Error('Edit payment link data not found in session cookie'))
  }

  const name = req.body['payment-link-title']
  const description = req.body['payment-link-description']

  if (name === '') {
    const errors = {
      title: 'Enter a title'
    }
    sessionData.informationPageRecovered = {
      errors,
      name,
      description
    }
    return res.redirect(formattedPathFor(paths.paymentLinks.editInformation, req.params.productExternalId))
  }

  sessionData.name = name
  sessionData.description = description

  return res.redirect(formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId))
}
