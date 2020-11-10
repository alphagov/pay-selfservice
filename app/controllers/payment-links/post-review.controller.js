'use strict'

const lodash = require('lodash')
const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const productTypes = require('../../utils/product-types')
const publicAuthClient = require('../../services/clients/public-auth.client')
const auth = require('../../services/auth.service.js')
const supportedLanguage = require('../../models/supported-language')

module.exports = async function createPaymentLink (req, res) {
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  const {
    paymentLinkTitle,
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

  try {
    const createTokenResponse = await publicAuthClient.createTokenForAccount({
      accountId: gatewayAccountId,
      correlationId: req.correlationId,
      payload: {
        account_id: gatewayAccountId,
        created_by: req.user.email,
        type: 'PRODUCTS',
        description: `Token for “${paymentLinkTitle}” payment link`,
        token_account_type: req.account.type
      }
    })

    const productPayload = {
      payApiToken: createTokenResponse.token,
      gatewayAccountId,
      name: paymentLinkTitle,
      type: productTypes.ADHOC,
      serviceNamePath,
      productNamePath,
      language: isWelsh ? supportedLanguage.WELSH : supportedLanguage.ENGLISH,
      referenceEnabled: paymentReferenceType === 'custom',
      ...paymentLinkDescription && { description: paymentLinkDescription },
      ...paymentLinkAmount && { price: paymentLinkAmount }
    }

    if (paymentReferenceType === 'custom') {
      productPayload.referenceLabel = paymentReferenceLabel

      if (paymentReferenceHint) {
        productPayload.referenceHint = paymentReferenceHint
      }
    }

    await productsClient.product.create(productPayload)

    lodash.unset(req, 'session.pageData.createPaymentLink')
    req.flash('createPaymentLinkSuccess', true)
    res.redirect(paths.paymentLinks.manage)
  } catch (error) {
    logger.error(`[requestId=${req.correlationId}] Creating a payment link failed - ${error.message}`)
    req.flash('genericError', 'Something went wrong. Please try again or contact support.')
    res.redirect(paths.paymentLinks.review)
  }
}
