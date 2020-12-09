'use strict'

const paths = require('../../paths')
const MetadataForm = require('./metadata/metadata-form')
const { getPaymentLinksSession } = require('../../utils/payment-links')

const { response } = require('../../utils/response.js')

function showAddMetadataPage (req, res) {
  const pageData = {
    form: new MetadataForm(),
    self: paths.paymentLinks.addMetadata,
    cancelRoute: paths.paymentLinks.review,
    createLink: true
  }
  return response(req, res, 'payment-links/reporting-columns/edit-reporting-columns', pageData)
}

function showEditMetadataPage (req, res) {
  const sessionData = getPaymentLinksSession(req)
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
