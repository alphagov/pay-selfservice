'use strict'

const paths = require('../../paths')
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
  const sessionData = getPaymentLinksContext(req).sessionData
  const key = req.params.metadataKey
  const currentMetadata = sessionData.metadata || {}
  const prefilledPage = {
    'metadata-column-header': key,
    'metadata-cell-value': currentMetadata[key]
  }
  const form = new MetadataForm(prefilledPage)
  const pageData = {
    form: form,
    self: `${paths.paymentLinks.addMetadata}/${key}`,
    cancelRoute: paths.paymentLinks.review,
    isEditing: true,
    canEditKey: true,
    createLink: true
  }
  return response(req, res, 'payment-links/reporting-columns/edit-reporting-columns', pageData)
}

module.exports = {
  showAddMetadataPage,
  showEditMetadataPage
}
