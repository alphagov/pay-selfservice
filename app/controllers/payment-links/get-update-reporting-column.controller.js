'use strict'

const MetadataForm = require('./metadata/metadata-form')
const { getPaymentLinksContext } = require('../../utils/payment-links')

const { response } = require('../../utils/response.js')

function showAddMetadataPage (req, res) {
  const paymentLinksContext = getPaymentLinksContext(req)
  const pageData = {
    form: new MetadataForm(),
    self: paymentLinksContext.addMetadataPageUrl,
    cancelRoute: paymentLinksContext.listMetadataPageUrl,
    createLink: paymentLinksContext.isCreatingPaymentLink
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
    self: paymentLinksContext.editMetadataPageUrl,
    cancelRoute: paymentLinksContext.listMetadataPageUrl,
    isEditing: true,
    canEditKey: true,
    createLink: paymentLinksContext.isCreatingPaymentLink
  }
  return response(req, res, 'payment-links/reporting-columns/edit-reporting-columns', pageData)
}

module.exports = {
  showAddMetadataPage,
  showEditMetadataPage
}
