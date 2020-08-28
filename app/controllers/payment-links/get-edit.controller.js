'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const auth = require('../../services/auth.service.js')
const formattedPathFor = require('../../utils/replace-params-in-path')

module.exports = async function showEditPaymentLink (req, res, next) {
  const { productExternalId } = req.params

  let editPaymentLinkData = lodash.get(req, 'session.editPaymentLinkData', {})
  if (editPaymentLinkData.externalId && editPaymentLinkData.externalId !== productExternalId) {
    // Currently it is only possible to edit one payment link at a time due to how we use the
    // session.
    delete req.session.editPaymentLinkData
    editPaymentLinkData = {}
  }

  const pageData = {
    self: formattedPathFor(paths.paymentLinks.edit, productExternalId),
    editInformation: formattedPathFor(paths.paymentLinks.editInformation, productExternalId),
    editReference: formattedPathFor(paths.paymentLinks.editReference, productExternalId),
    editAmount: formattedPathFor(paths.paymentLinks.editAmount, productExternalId),
    addMetadata: formattedPathFor(paths.paymentLinks.metadata.add, productExternalId),
    formattedPathFor,
    paths
  }

  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  try {
    const product = await productsClient.product.getByProductExternalId(gatewayAccountId, productExternalId)
    const productCheck = lodash.cloneDeep(product)
    delete editPaymentLinkData.metadata
    pageData.product = lodash.merge(product, editPaymentLinkData)
    pageData.changed = !lodash.isEqual(productCheck, pageData.product)
    lodash.set(req, 'session.editPaymentLinkData', pageData.product)
    return response(req, res, 'payment-links/edit', pageData)
  } catch (err) {
    return next(new Error(`Getting product from products failed - ${err.message}`))
  }
}
