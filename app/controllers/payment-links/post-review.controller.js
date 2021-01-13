'use strict'

const lodash = require('lodash')
const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const productTypes = require('../../utils/product-types')
const publicAuthClient = require('../../services/clients/public-auth.client')
const supportedLanguage = require('../../models/supported-language')
const { keys } = require('@govuk-pay/pay-js-commons').logging

module.exports = async function createPaymentLink (req, res) {
  const gatewayAccountId = req.account.gateway_account_id
  const {
    paymentLinkTitle,
    paymentLinkDescription,
    paymentLinkAmount,
    serviceNamePath,
    productNamePath,
    paymentReferenceType,
    paymentReferenceLabel,
    paymentReferenceHint,
    isWelsh,
    metadata
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
      metadata,
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

    const numberOfMetadataKeys = (metadata && Object.keys(metadata).length) || 0
    const logContext = {
      is_internal_user: req.user && req.user.internalUser,
      product_external_id: req.params && req.params.productExternalId,
      has_metadata: !!numberOfMetadataKeys,
      number_of_metadata_keys: numberOfMetadataKeys
    }
    logContext[keys.GATEWAY_ACCOUNT_TYPE] = req.account && req.account.type
    logContext[keys.GATEWAY_ACCOUNT_ID] = req.account && req.account.gateway_account_id
    logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId

    logger.info('Created payment link', logContext)

    lodash.unset(req, 'session.pageData.createPaymentLink')
    req.flash('createPaymentLinkSuccess', true)
    res.redirect(paths.paymentLinks.manage.index)
  } catch (error) {
    logger.error(`[requestId=${req.correlationId}] Creating a payment link failed - ${error.message}`)
    req.flash('genericError', 'Something went wrong. Please try again or contact support.')
    res.redirect(paths.paymentLinks.review)
  }
}
