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

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  let updatedPageData = lodash.cloneDeep(pageData)

  updatedPageData.paymentLinkTitle = req.body['payment-link-title']
  updatedPageData.paymentLinkDescription = req.body['payment-link-description']
  updatedPageData.serviceNamePath = makeNiceURL(req.body['service-name-path'])
  updatedPageData.productNamePath = makeNiceURL(req.body['payment-link-title'])
  lodash.set(req, 'session.pageData.createPaymentLink', updatedPageData)

  if (updatedPageData.paymentLinkTitle === '') {
    req.flash('genericError', `<h2>There was a problem with the details you gave for:</h2><ul class="govuk-list govuk-error-summary__list"><li><a href="#payment-link-title">Title</a></li></ul>`)
    return res.redirect(paths.paymentLinks.information)
  }

  if (req.body['change'] === 'true') {
    if (!lodash.isEmpty(pageData) && !lodash.isEqual(pageData, updatedPageData)) {
      req.flash('generic', 'The details have been updated')
    }
    return res.redirect(paths.paymentLinks.review)
  }

  productsClient.product.getByProductPath(updatedPageData.serviceNamePath, updatedPageData.productNamePath)
    .then(product => {
    // if product exists we need to alert the user they must use a different URL
      return res.redirect(paths.paymentLinks.webAddress)
    })
    .catch((err) => { // eslint-disable-line handle-callback-err
    // if it errors then it means no product was found and that’s good
      return res.redirect(paths.paymentLinks.reference)
    })
}
