'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')
const productTypes = require('../../utils/product_types')
const publicAuthClient = require('../../services/clients/public_auth_client')
const auth = require('../../services/auth_service.js')
const supportedLanguage = require('../../models/supported-language')

module.exports = (req, res) => {
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  const { paymentLinkTitle,
    paymentLinkDescription,
    paymentLinkAmount,
    serviceNamePath,
    productNamePath,
    paymentReferenceType,
    paymentReferenceLabel,
    paymentReferenceHint,
    isWelsh
  } = lodash.get(req, 'session.pageData.createPaymentLink', {})

  if (!paymentLinkTitle) {
    return res.redirect(paths.paymentLinks.start)
  }
  publicAuthClient.createTokenForAccount({
    accountId: gatewayAccountId,
    correlationId: req.correlationId,
    payload: {
      account_id: gatewayAccountId,
      created_by: req.user.email,
      type: 'PRODUCTS',
      description: `Token for “${paymentLinkTitle}” payment link`
    }
  })
    .then(publicAuthData => {
      const productPayload = {
        payApiToken: publicAuthData.token,
        gatewayAccountId,
        name: paymentLinkTitle,
        type: productTypes.ADHOC,
        serviceNamePath,
        productNamePath,
        language: isWelsh ? supportedLanguage.WELSH : supportedLanguage.ENGLISH
      }

      if (paymentLinkDescription) {
        productPayload.description = paymentLinkDescription
      }

      if (paymentLinkAmount) {
        productPayload.price = paymentLinkAmount
      }

      productPayload.referenceEnabled = paymentReferenceType === 'custom'

      if (paymentReferenceType === 'custom') {
        productPayload.referenceLabel = paymentReferenceLabel

        if (paymentReferenceHint) {
          productPayload.referenceHint = paymentReferenceHint
        }
      }
      return productsClient.product.create(productPayload)
    })
    .then(product => {
      lodash.unset(req, 'session.pageData.createPaymentLink')
      req.flash('generic', `
        <h2>Your payment link is now live</h2>
        <p>Give this link to your users to collect payments for your service.</p>
        <p>Edit your payment links to make reporting easier.</p>
      `)
      res.redirect(paths.paymentLinks.manage)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Creating a payment link failed - ${err.message}`)
      req.flash('genericError', `<h2>There were errors</h2><p>Error while creating payment link</p>`)
      return res.redirect(paths.paymentLinks.review)
    })
}
