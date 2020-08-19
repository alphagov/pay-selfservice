'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const logger = require('../../utils/logger')(__filename)
const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const productTypes = require('../../utils/product-types')
const publicAuthClient = require('../../services/clients/public-auth.client')
const authService = require('../../services/auth.service.js')
const { isCurrency, isHttps, isAboveMaxAmount } = require('../../browsered/field-validation-checks')
const { penceToPounds, safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')

module.exports = (req, res) => {
  const gatewayAccountId = authService.getCurrentGatewayAccountId(req)
  const confirmationPage = req.body['confirmation-page']
  const paymentDescription = req.body['payment-description']
  const paymentAmountInPence = safeConvertPoundsStringToPence(req.body['payment-amount'], true)
  lodash.set(req, 'session.pageData.createPrototypeLink', { paymentAmountInPence, paymentDescription, confirmationPage })

  if (!paymentDescription) {
    req.flash('genericError', `<h2>Enter a description</h2> Tell users what they are paying for`)
  } else if (!paymentAmountInPence || isCurrency(penceToPounds(paymentAmountInPence))) {
    req.flash('genericError', `<h2>Use valid characters only</h2> ${isCurrency(paymentAmountInPence)}`)
  } else if (isAboveMaxAmount(penceToPounds(paymentAmountInPence))) {
    req.flash('genericError', `<h2>Enter a valid amount</h2> ${isAboveMaxAmount(penceToPounds(paymentAmountInPence))}`)
  } else if (!confirmationPage || isHttps(confirmationPage)) {
    req.flash('genericError', `<h2>Enter a valid secure URL</h2>${isHttps(confirmationPage)}`)
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
    } })
    .then(publicAuthData => productsClient.product.create({
      payApiToken: publicAuthData.token,
      gatewayAccountId,
      name: req.body['payment-description'],
      returnUrl: req.body['confirmation-page'],
      price: paymentAmountInPence,
      type: productTypes.PROTOTYPE
    }))
    .then(product => {
      const prototypeLink = lodash.get(product, 'links.pay.href')
      lodash.set(req, 'session.pageData.createPrototypeLink', {})
      return response(req, res, 'dashboard/demo-service/confirm', { prototypeLink })
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Create product failed - ${err.message}`)
      req.flash('genericError', `<h2>There were errors</h2> Error while creating product`)
      return res.redirect(paths.prototyping.demoService.create)
    })
}
