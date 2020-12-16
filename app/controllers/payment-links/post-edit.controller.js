'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const logger = require('../../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const { CORRELATION_HEADER } = require('../../utils/correlation-header.js')

module.exports = async function updatePaymentLink (req, res, next) {
  const { productExternalId } = req.params
  const gatewayAccountId = req.account.gateway_account_id

  const editPaymentLinkData = lodash.get(req, 'session.editPaymentLinkData')
  if (!editPaymentLinkData || editPaymentLinkData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    return res.redirect(paths.paymentLinks.manage.index)
  }

  try {

    const correlationId = req.headers[CORRELATION_HEADER] || ''

    const logContext = {
      internal_user: req.user.internalUser,
      product_external_id: req.params.productExternalId
    }

    logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId
    logContext[keys.CORRELATION_ID] = correlationId

    logger.info(`Updating Payment link`, logContext)

    await productsClient.product.update(gatewayAccountId, productExternalId, editPaymentLinkData)
    lodash.unset(req, 'session.editPaymentLinkData')
    req.flash('generic', `Your payment link has been updated`)
    res.redirect(paths.paymentLinks.manage.index)
  } catch (err) {
    return next(new Error(`Update of payment link failed. Error: ${err.message}`))
  }
}
