'use strict'

const lodash = require('lodash')

const logger = require('../../utils/logger')(__filename)
const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const productTypes = require('../../utils/product-types')
const publicAuthClient = require('../../services/clients/public-auth.client')
const { isCurrency, isHttps, isAboveMaxAmount } = require('../../browsered/field-validation-checks')
const { penceToPounds, safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

module.exports = async (req, res) => {
  const gatewayAccountId = req.account.gateway_account_id
  const confirmationPage = req.body['confirmation-page']
  const paymentDescription = req.body['payment-description']
  const paymentAmountInPence = safeConvertPoundsStringToPence(req.body['payment-amount'], true)
  lodash.set(req, 'session.pageData.createPrototypeLink', { paymentAmountInPence, paymentDescription, confirmationPage })

  if (!paymentDescription) {
    req.flash('genericError', 'Enter a description')
  } else if (!paymentAmountInPence || isCurrency(penceToPounds(paymentAmountInPence))) {
    req.flash('genericError', isCurrency(paymentAmountInPence))
  } else if (isAboveMaxAmount(penceToPounds(paymentAmountInPence))) {
    req.flash('genericError', isAboveMaxAmount(penceToPounds(paymentAmountInPence)))
  } else if (!confirmationPage || isHttps(confirmationPage)) {
    req.flash('genericError', isHttps(confirmationPage))
  }

  if (lodash.get(req, 'session.flash.genericError.length')) {
    return res.redirect(formatAccountPathsFor(paths.account.prototyping.demoService.create, req.account.external_id))
  }

  try {
    const publicAuthData = await publicAuthClient.createTokenForAccount({
      accountId: gatewayAccountId,
      correlationId: req.correlationId,
      payload: {
        account_id: gatewayAccountId,
        created_by: req.user.email,
        description: `Token for Prototype: ${req.body['payment-description']}`,
        type: 'PRODUCTS'
      }
    })

    const product = await productsClient.product.create({
      payApiToken: publicAuthData.token,
      gatewayAccountId,
      name: req.body['payment-description'],
      returnUrl: req.body['confirmation-page'],
      price: paymentAmountInPence,
      type: productTypes.PROTOTYPE
    })

    const prototypeLink = lodash.get(product, 'links.pay.href')
    lodash.set(req, 'session.pageData.createPrototypeLink', {})
    return response(req, res, 'dashboard/demo-service/confirm', { prototypeLink })
  } catch (err) {
    logger.error(`[requestId=${req.correlationId}] Create product failed - ${err.message}`)
    req.flash('genericError', 'Something went wrong. Please try again or contact support.')
    return res.redirect(formatAccountPathsFor(paths.account.prototyping.demoService.create, req.account.external_id))
  }
}
