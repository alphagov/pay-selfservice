'use strict'

const lodash = require('lodash')
const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')

const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const productsClient = require('../../services/clients/products.client.js')
const productTypes = require('../../utils/product-types')
const publicAuthClient = require('../../services/clients/public-auth.client')
const supportedLanguage = require('../../models/supported-language')

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
    referenceEnabled,
    referenceLabel,
    referenceHint,
    isWelsh,
    metadata
  } = lodash.get(req, 'session.pageData.createPaymentLink', {})

  // TODO: remove - session variables have been renamed to `referenceEnabled`, `referenceLabel` and
  // `referenceHint`. Temporarily looking at old and new session variables to not break journeys in
  // progress.
  const resolvedReferenceEnabled = paymentReferenceType ? paymentReferenceType === 'custom' : referenceEnabled
  const resolvedReferenceLabel = paymentReferenceLabel || referenceLabel
  const resolvedReferenceHint = paymentReferenceHint || referenceHint

  if (!paymentLinkTitle) {
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.start, req.account && req.account.external_id))
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
      referenceEnabled: resolvedReferenceEnabled,
      ...paymentLinkDescription && { description: paymentLinkDescription },
      ...paymentLinkAmount && { price: paymentLinkAmount }
    }

    if (resolvedReferenceEnabled) {
      productPayload.referenceLabel = resolvedReferenceLabel

      if (resolvedReferenceHint) {
        productPayload.referenceHint = resolvedReferenceHint
      }
    }

    await productsClient.product.create(productPayload)

    const numberOfMetadataKeys = (metadata && Object.keys(metadata).length) || 0
    logger.info('Created payment link', {
      product_external_id: req.params && req.params.productExternalId,
      has_metadata: !!numberOfMetadataKeys,
      number_of_metadata_keys: numberOfMetadataKeys
    })

    lodash.unset(req, 'session.pageData.createPaymentLink')
    req.flash('createPaymentLinkSuccess', true)

    res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
  } catch (error) {
    logger.error(`Creating a payment link failed - ${error.message}`)
    req.flash('genericError', 'Something went wrong. Please try again or contact support.')
    res.redirect(formatAccountPathsFor(paths.account.paymentLinks.review, req.account && req.account.external_id))
  }
}
