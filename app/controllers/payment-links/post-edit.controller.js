'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')

module.exports = async function updatePaymentLink (req, res, next) {
  const { productExternalId } = req.params
  const gatewayAccountId = req.account.gateway_account_id

  const editPaymentLinkData = lodash.get(req, 'session.editPaymentLinkData')
  if (!editPaymentLinkData || editPaymentLinkData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    return res.redirect(paths.paymentLinks.manage)
  }

  try {
    await productsClient.product.update(gatewayAccountId, productExternalId, editPaymentLinkData)
    lodash.unset(req, 'session.editPaymentLinkData')
    req.flash('generic', `Your payment link has been updated`)
    res.redirect(paths.paymentLinks.manage)
  } catch (err) {
    return next(new Error(`Update of payment link failed. Error: ${err.message}`))
  }
}
