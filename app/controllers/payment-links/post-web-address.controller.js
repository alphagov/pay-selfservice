'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const { slugify, removeIndefiniteArticles } = require('@govuk-pay/pay-js-commons').nunjucksFilters

const makeNiceURL = string => {
  return slugify(removeIndefiniteArticles(string))
}

module.exports = async function postWebAddress (req, res, next) {
  const paymentLinkData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!paymentLinkData) {
    next(new Error('Payment link data not found in session cookie'))
  }

  const paymentLinkURLPath = req.body['payment-name-path']

  const errors = {}
  let resolvedURLPath
  if (paymentLinkURLPath === '') {
    errors.path = 'Enter a website address'
  } else {
    resolvedURLPath = makeNiceURL(paymentLinkURLPath)

    try {
      await productsClient.product.getByProductPath(paymentLinkData.serviceNamePath, resolvedURLPath)
      // URL already in use
      errors.path = 'Enter a different website address'
    } catch (err) {
      // URL not in use, continue
      paymentLinkData.productNamePath = resolvedURLPath
      return res.redirect(paths.paymentLinks.reference)
    }
  }

  // there were errors, show form again
  lodash.set(req, 'session.pageData.createPaymentLink.webAddressPageRecovered', {
    errors,
    paymentLinkURLPath
  })
  return res.redirect(paths.paymentLinks.webAddress)
}
