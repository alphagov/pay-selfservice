'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')
const formattedPathFor = require('../../utils/replace-params-in-path')

module.exports = function postEditInformation (req, res) {
  const { productExternalId } = req.params
  
  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData || sessionData.externalId != productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    return res.redirect(paths.paymentLinks.manage)
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
    return res.redirect(formattedPathFor(paths.paymentLinks.editInformation, productExternalId))
  }

  sessionData.name = name
  sessionData.description = description

  return res.redirect(formattedPathFor(paths.paymentLinks.edit, productExternalId))
}
