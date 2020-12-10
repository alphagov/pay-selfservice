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

  // @TODO(sfount) feature flag to be removed with PP-7509
  const shouldUseInlineReportingColumns = process.env.MANAGING_PAYMENT_LINKS_INLINE_REPORTING_COLUMNS === 'true'
  const addMetadataUrl = shouldUseInlineReportingColumns
    ? formattedPathFor(paths.paymentLinks.manage.addMetadata, productExternalId)
    : formattedPathFor(paths.paymentLinks.metadata.add, productExternalId)

  const pageData = {
    self: formattedPathFor(paths.paymentLinks.manage.edit, productExternalId),
    editInformation: formattedPathFor(paths.paymentLinks.editInformation, productExternalId),
    editReference: formattedPathFor(paths.paymentLinks.editReference, productExternalId),
    editAmount: formattedPathFor(paths.paymentLinks.editAmount, productExternalId),
    addMetadata: addMetadataUrl,
    formattedPathFor,
    paths
  }

  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  try {
    const product = await productsClient.product.getByProductExternalId(gatewayAccountId, productExternalId)
    const productCheck = lodash.cloneDeep(product)

    if (!shouldUseInlineReportingColumns) {
      // this is an existing workaround because the existing code should always directly reflect the backend
      // this should be removed when we remove the feature flag and are fully in-flow editing
      delete editPaymentLinkData.metadata
    } else {
      // if this is the first time we're loading the product, update the edit copy
      if (!editPaymentLinkData.metadata) {
        editPaymentLinkData.metadata = product.metadata
        delete product.metadata
      }
    }
    pageData.product = lodash.merge(product, editPaymentLinkData)
    pageData.metadata = shouldUseInlineReportingColumns
      ? editPaymentLinkData.metadata
      : product.metadata

    pageData.changed = !lodash.isEqual(productCheck, pageData.product)

    // IF we _are_ doing inline editing of reporting columns, it should be populated ONCE
    // but then it shouldn't be continually merged
    lodash.set(req, 'session.editPaymentLinkData', pageData.product)
    return response(req, res, 'payment-links/edit', pageData)
  } catch (err) {
    return next(new Error(`Getting product from products failed - ${err.message}`))
  }
}
