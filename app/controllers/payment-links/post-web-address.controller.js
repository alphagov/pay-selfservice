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

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  let updatedPageData = lodash.cloneDeep(pageData)

  if (updatedPageData.productNamePath === '') {
    req.flash('error', 'Please change the website address')
    return res.redirect(paths.paymentLinks.webAddress)
  }

  updatedPageData.productNamePath = makeNiceURL(req.body['payment-name-path'])
  lodash.set(req, 'session.pageData.createPaymentLink', updatedPageData)

  productsClient.product.getByProductPath(updatedPageData.serviceNamePath, updatedPageData.productNamePath)
    .then(product => {
    // if product exists we need to alert the user they must use a different URL
      req.flash('error', 'Please change the website address')
      return res.redirect(paths.paymentLinks.webAddress)
    })
    .catch((err) => { // eslint-disable-line handle-callback-err
    // if it errors then it means no product was found and that’s good
      return res.redirect(paths.paymentLinks.reference)
    })
}
