'use strict'

// NPM dependencies
const lodash = require('lodash')
const { slugify, removeIndefiniteArticles } = require('@govuk-pay/pay-js-commons').nunjucksFilters

// Local dependencies
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')

const makeNiceURL = string => {
  return slugify(removeIndefiniteArticles(string))
}

module.exports = async function postInformation (req, res, next) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!sessionData) {
    next(new Error('Payment link data not found in session cookie'))
  }

  const title = req.body['payment-link-title']
  const description = req.body['payment-link-description']
  const serviceNamePath = req.body['service-name-path']

  if (title === '') {
    const errors = {
      title: 'Enter a title'
    }
    sessionData.informationPageRecovered = {
      errors,
      title,
      description
    }
    return res.redirect(paths.paymentLinks.information)
  }

  sessionData.paymentLinkTitle = title
  sessionData.paymentLinkDescription = description
  sessionData.serviceNamePath = makeNiceURL(serviceNamePath)
  sessionData.productNamePath = makeNiceURL(title)

  if (req.body['change'] === 'true') {
    req.flash('generic', 'The details have been updated')
    return res.redirect(paths.paymentLinks.review)
  }

  try {
    await productsClient.product.getByProductPath(sessionData.serviceNamePath, sessionData.productNamePath)
    // if product exists we need to alert the user they must use a different URL
    return res.redirect(paths.paymentLinks.webAddress)
  } catch (err) {
    // if it errors then it means no product was found and that’s good
    return res.redirect(paths.paymentLinks.reference)
  }
}
