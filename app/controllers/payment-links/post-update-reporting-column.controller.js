'use strict'

const MetadataForm = require('./metadata/metadata-form')
const { getPaymentLinksContext, metadata } = require('../../utils/payment-links')

const { response } = require('../../utils/response.js')

function addMetadata (req, res) {
  const paymentLinksContext = getPaymentLinksContext(req)
  const pageData = {
    self: paymentLinksContext.self,
    cancelRoute: paymentLinksContext.cancelUrl,
    createLink: paymentLinksContext.createLink
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

  // @TODO(sfount) rename cancelUrl to listReportingColumnsPageUrl
  // @TODO(sfount) rename self to addMetadataPageUrl, this can be assigned to self
  res.redirect(paymentLinksContext.cancelUrl)
}

function editMetadata (req, res) {
  const paymentLinksContext = getPaymentLinksContext(req)
  const key = req.params.metadataKey

  const existingMetadata = { ...paymentLinksContext.sessionData.metadata }
  delete existingMetadata[key]
  const form = new MetadataForm(req.body, existingMetadata)

  const pageData = {
    self: `${paymentLinksContext.self}/${key}`,
    cancelRoute: paymentLinksContext.cancelUrl,
    isEditing: true,
    canEditKey: true,
    createLink: paymentLinksContext.createLink
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

  // @TODO(sfount) naming!
  res.redirect(paymentLinksContext.cancelUrl)
}

function deleteMetadata (req, res) {
  const paymentLinksContext = getPaymentLinksContext(req)
  const key = req.params.metadataKey

  metadata.removeMetadata(paymentLinksContext.sessionData, key)

  // @TODO(sfount) naming!
  res.redirect(paymentLinksContext.cancelUrl)
}

module.exports = {
  addMetadata,
  editMetadata,
  deleteMetadata
}
