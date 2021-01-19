'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const productsClient = require('../../services/clients/products.client.js')
const logger = require('../../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging

module.exports = async function updatePaymentLink (req, res, next) {
  const { productExternalId } = req.params
  const gatewayAccountId = req.account.gateway_account_id

  const editPaymentLinkData = lodash.get(req, 'session.editPaymentLinkData')
  if (!editPaymentLinkData || editPaymentLinkData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')

    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
  }

  try {
    await productsClient.product.update(gatewayAccountId, productExternalId, editPaymentLinkData)

    const numberOfMetadataKeys = (editPaymentLinkData.metadata && Object.keys(editPaymentLinkData.metadata).length) || 0
    const logContext = {
      is_internal_user: req.user && req.user.internalUser,
      product_external_id: req.params && req.params.productExternalId,
      has_metadata: !!numberOfMetadataKeys,
      number_of_metadata_keys: numberOfMetadataKeys
    }
    logContext[keys.GATEWAY_ACCOUNT_TYPE] = req.account && req.account.type
    logContext[keys.GATEWAY_ACCOUNT_ID] = req.account && req.account.gateway_account_id
    logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId

    logger.info('Updated payment link', logContext)

    lodash.unset(req, 'session.editPaymentLinkData')
    req.flash('generic', 'Your payment link has been updated')
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
  } catch (err) {
    return next(new Error(`Update of payment link failed. Error: ${err.message}`))
  }
}
