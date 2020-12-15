'use strict'

const MetadataForm = require('./metadata/metadata-form')
const { getPaymentLinksContext, metadata } = require('../../utils/payment-links')

const { response } = require('../../utils/response.js')

function addMetadata (req, res) {
  const paymentLinksContext = getPaymentLinksContext(req)
  const pageData = {
    self: paymentLinksContext.addMetadataPageUrl,
    cancelRoute: paymentLinksContext.listMetadataPageUrl,
    createLink: paymentLinksContext.isCreatingPaymentLink
  }
  const form = new MetadataForm(req.body, paymentLinksContext.sessionData && paymentLinksContext.sessionData.metadata)
  const validated = form.validate()

  if (validated.errors.length) {
    pageData.tested = validated
    pageData.form = form
    response(req, res, 'payment-links/reporting-columns/edit-reporting-columns', pageData)
    return
  }

  metadata.addMetadata(
    paymentLinksContext.sessionData,
    form.values[form.fields.metadataKey.id],
    form.values[form.fields.metadataValue.id]
  )

  res.redirect(paymentLinksContext.listMetadataPageUrl)
}

function editMetadata (req, res) {
  const paymentLinksContext = getPaymentLinksContext(req)
  const key = req.params.metadataKey

  const existingMetadata = { ...paymentLinksContext.sessionData.metadata }
  delete existingMetadata[key]
  const form = new MetadataForm(req.body, existingMetadata)

  const pageData = {
    self: paymentLinksContext.editMetadataPageUrl,
    cancelRoute: paymentLinksContext.listMetadataPageUrl,
    isEditing: true,
    canEditKey: true,
    createLink: paymentLinksContext.isCreatingPaymentLink
  }
  const validated = form.validate()

  if (validated.errors.length) {
    pageData.tested = validated
    pageData.form = form
    response(req, res, 'payment-links/reporting-columns/edit-reporting-columns', pageData)
    return
  }

  metadata.updateMetadata(
    paymentLinksContext.sessionData,
    key,
    form.values[form.fields.metadataKey.id],
    form.values[form.fields.metadataValue.id]
  )

  res.redirect(paymentLinksContext.listMetadataPageUrl)
}

function deleteMetadata (req, res) {
  const paymentLinksContext = getPaymentLinksContext(req)
  const key = req.params.metadataKey

  metadata.removeMetadata(paymentLinksContext.sessionData, key)

  res.redirect(paymentLinksContext.listMetadataPageUrl)
}

module.exports = {
  addMetadata,
  editMetadata,
  deleteMetadata
}
