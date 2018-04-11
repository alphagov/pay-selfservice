'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')
const slugify = require('../../utils/nunjucks-filters/slugify')
const removeDefinateArticles = require('../../utils/nunjucks-filters/remove-definate-articles')

const makeNiceURL = string => {
  return slugify(removeDefinateArticles(string))
}

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  let updatedPageData = lodash.cloneDeep(pageData)

  if (updatedPageData.productNamePath === '') {
    req.flash('genericError', `<h2>There was a problem with the details you gave for:</h2><ul class="error-summary-list"><li><a href="#payment-name-path">Please change the website address</a></li></ul>`)
    return res.redirect(paths.paymentLinks.webAddress)
  }

  updatedPageData.productNamePath = makeNiceURL(req.body['payment-name-path'])
  lodash.set(req, 'session.pageData.createPaymentLink', updatedPageData)

  productsClient.product.getByProductPath(updatedPageData.serviceNamePath, updatedPageData.productNamePath)
  .then(product => {
    // if product exists we need to alert the user they must use a different URL
    req.flash('genericError', `<ul class="error-summary-list"><li><a href="#payment-name-path">The website address is already taken</a></li></ul>`)
    return res.redirect(paths.paymentLinks.webAddress)
  })
  .catch((err) => { // eslint-disable-line handle-callback-err
    // if it errors then it means no product was found and that’s good
    return res.redirect(paths.paymentLinks.amount)
  })
}
