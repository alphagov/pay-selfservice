'use strict'

const paths = require('../../paths')
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
  const sessionData = getPaymentLinksContext(req).sessionData
  const form = new MetadataForm(req.body, sessionData.metadata)
  const key = req.params.metadataKey
  const pageData = {
    self: `${paths.paymentLinks.addMetadata}/${key}`,
    cancelRoute: paths.paymentLinks.review,
    isEditing: true,
    canEditKey: true,
    createLink: true
  }
  const validated = form.validate()

  if (validated.errors.length) {
    pageData.tested = validated
    pageData.form = form
    response(req, res, 'payment-links/reporting-columns/edit-reporting-columns', pageData)
    return
  }

  metadata.updateMetadata(
    sessionData,
    key,
    form.values[form.fields.metadataKey.id],
    form.values[form.fields.metadataValue.id]
  )
  res.redirect(paths.paymentLinks.review)
}

function deleteMetadata (req, res) {
  const sessionData = getPaymentLinksContext(req).sessionData
  const key = req.params.metadataKey

  metadata.removeMetadata(sessionData, key)
  res.redirect(paths.paymentLinks.review)
}

module.exports = {
  addMetadata,
  editMetadata,
  deleteMetadata
}
