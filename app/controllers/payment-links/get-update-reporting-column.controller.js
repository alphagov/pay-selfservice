'use strict'

const MetadataForm = require('./metadata/metadata-form')
const { getPaymentLinksContext } = require('../../utils/payment-links')

const { response } = require('../../utils/response.js')

function showAddMetadataPage (req, res) {
  const paymentLinksContext = getPaymentLinksContext(req)
  const pageData = {
    form: new MetadataForm(),
    self: paymentLinksContext.addMetadataUrl,
    cancelRoute: paymentLinksContext.cancelUrl,
    createLink: paymentLinksContext.createLink
  }
  return response(req, res, 'payment-links/reporting-columns/edit-reporting-columns', pageData)
}

function showEditMetadataPage (req, res) {
  const paymentLinksContext = getPaymentLinksContext(req)
  const key = req.params.metadataKey
  const currentMetadata = paymentLinksContext.sessionData && paymentLinksContext.sessionData.metadata
  const prefilledPage = {
    'metadata-column-header': key,
    'metadata-cell-value': currentMetadata[key]
  }
  const form = new MetadataForm(prefilledPage)
  const pageData = {
    form: form,
    self: `${paymentLinksContext.self}/${key}`,
    cancelRoute: paymentLinksContext.cancelUrl,
    isEditing: true,
    canEditKey: true,
    createLink: paymentLinksContext.createLink
  }
  return response(req, res, 'payment-links/reporting-columns/edit-reporting-columns', pageData)
}

module.exports = {
  showAddMetadataPage,
  showEditMetadataPage
}
