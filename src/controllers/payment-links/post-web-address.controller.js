'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const { slugify, removeIndefiniteArticles } = require('@govuk-pay/pay-js-commons').nunjucksFilters

const formatAccountPathsFor = require('../../utils/format-account-paths-for')

const makeNiceURL = string => {
  return slugify(removeIndefiniteArticles(string))
}

module.exports = async function postWebAddress (req, res, next) {
  const paymentLinkData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!paymentLinkData) {
    return next(new Error('Payment link data not found in session cookie'))
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
      return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.reference, req.account && req.account.external_id))
    }
  }

  // there were errors, show form again
  lodash.set(req, 'session.pageData.createPaymentLink.webAddressPageRecovered', {
    errors,
    paymentLinkURLPath
  })
  return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.webAddress, req.account && req.account.external_id))
}
