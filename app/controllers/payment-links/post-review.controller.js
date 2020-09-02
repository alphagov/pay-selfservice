'use strict'

const lodash = require('lodash')

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const productTypes = require('../../utils/product-types')
const publicAuthClient = require('../../services/clients/public-auth.client')
const auth = require('../../services/auth.service.js')
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
      req.flash('createPaymentLinkSuccess', true)
      res.redirect(paths.paymentLinks.manage)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Creating a payment link failed - ${err.message}`)
      req.flash('genericError', 'Something went wrong. Please try again or contact support.')
      return res.redirect(paths.paymentLinks.review)
    })
}
