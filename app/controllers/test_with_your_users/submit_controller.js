'use strict'

// NPM dependencies
const lodash = require('lodash')
const logger = require('winston')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')
const productTypes = require('../../utils/product_types')
const publicAuthClient = require('../../services/clients/public_auth_client')
const authService = require('../../services/auth_service.js')
const {utils} = require('@govuk-pay/pay-js-commons')
const currencyFormatter = require('../../utils/currency_formatter')

module.exports = (req, res) => {
  const params = {
    linksPage: paths.prototyping.demoService.links
  }

  const gatewayAccountId = authService.getCurrentGatewayAccountId(req)
  const confirmationPage = req.body['confirmation-page']
  const paymentDescription = req.body['payment-description']
  const paymentAmount = currencyFormatter(req.body['payment-amount'])
  lodash.set(req, 'session.pageData.createPrototypeLink', {paymentAmount, paymentDescription, confirmationPage})

  if (!paymentDescription) {
    req.flash('genericError', `<h2>Enter a description</h2> Tell users what they are paying for`)
  } else if (!paymentAmount || utils.fieldValidationChecks.isCurrency(paymentAmount)) {
    req.flash('genericError', `<h2>Use valid characters only</h2> ${utils.fieldValidationChecks.isCurrency(paymentAmount)}`)
  } else if (utils.fieldValidationChecks.isAboveMaxAmount(paymentAmount)) {
    req.flash('genericError', `<h2>Enter a valid amount</h2> ${utils.fieldValidationChecks.isAboveMaxAmount(paymentAmount)}`)
  } else if (!confirmationPage || utils.fieldValidationChecks.isHttps(confirmationPage)) {
    req.flash('genericError', `<h2>Enter a valid secure URL</h2>${utils.fieldValidationChecks.isHttps(confirmationPage)}`)
  }

  if (lodash.get(req, 'session.flash.genericError.length')) {
    return res.redirect(paths.prototyping.demoService.create)
  }

  publicAuthClient.createTokenForAccount({
    accountId: gatewayAccountId,
    correlationId: req.correlationId,
    payload: {
      account_id: gatewayAccountId,
      created_by: req.user.email,
      description: `Token for Prototype: ${req.body['payment-description']}`
    }})
    .then(publicAuthData => productsClient.product.create({
      payApiToken: publicAuthData.token,
      gatewayAccountId,
      name: req.body['payment-description'],
      returnUrl: req.body['confirmation-page'],
      serviceName: req.service.name,
      price: Math.trunc(paymentAmount * 100),
      type: productTypes.PROTOTYPE
    }))
    .then(product => {
      params.prototypeLink = lodash.get(product, 'links.pay.href')
      lodash.set(req, 'session.pageData.createPrototypeLink', {})
      return response(req, res, 'dashboard/demo-service/confirm', params)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Create product failed - ${err.message}`)
      req.flash('genericError', `<h2>There were errors</h2> Error while creating product`)
      return res.redirect(paths.prototyping.demoService.create)
    })
}
