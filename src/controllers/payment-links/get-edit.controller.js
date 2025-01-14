'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

module.exports = async function showEditPaymentLink (req, res, next) {
  const { productExternalId } = req.params
  const accountExternalId = req.account && req.account.external_id

  let editPaymentLinkData = lodash.get(req, 'session.editPaymentLinkData', {})
  if (editPaymentLinkData.externalId && editPaymentLinkData.externalId !== productExternalId) {
    // Currently it is only possible to edit one payment link at a time due to how we use the
    // session.
    delete req.session.editPaymentLinkData
    editPaymentLinkData = {}
  }

  const addMetadataUrl = formatAccountPathsFor(paths.account.paymentLinks.manage.addMetadata, accountExternalId, productExternalId)
  const editMetadataPath = formatAccountPathsFor(paths.account.paymentLinks.manage.editMetadata, accountExternalId)
  const pageData = {
    self: formatAccountPathsFor(paths.account.paymentLinks.manage.edit, accountExternalId, productExternalId),
    editInformation: formatAccountPathsFor(paths.account.paymentLinks.manage.editInformation, accountExternalId, productExternalId),
    editReference: formatAccountPathsFor(paths.account.paymentLinks.manage.editReference, accountExternalId, productExternalId),
    editAmount: formatAccountPathsFor(paths.account.paymentLinks.manage.editAmount, accountExternalId, productExternalId),
    addMetadata: addMetadataUrl,
    editMetadata: editMetadataPath,
    paths
  }
  const gatewayAccountId = req.account.gateway_account_id

  try {
    const product = await productsClient.product.getByProductExternalIdAndGatewayAccountId(gatewayAccountId, productExternalId)
    const productCheck = lodash.cloneDeep(product)

    // if this is the first time we're loading the product, update the session editing copy
    // and remove the local copy of backend metadata as that may be out of date with our editing session
    if (!editPaymentLinkData.metadata) {
      editPaymentLinkData.metadata = product.metadata
    }
    delete product.metadata

    pageData.product = lodash.merge(product, editPaymentLinkData)
    pageData.metadata = editPaymentLinkData.metadata
    pageData.changed = !lodash.isEqual(productCheck, pageData.product)

    lodash.set(req, 'session.editPaymentLinkData', pageData.product)
    return response(req, res, 'payment-links/edit', pageData)
  } catch (err) {
    return next(new Error(`Getting product from products failed - ${err.message}`))
  }
}
