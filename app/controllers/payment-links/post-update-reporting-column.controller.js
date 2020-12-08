'use strict'

const paths = require('../../paths')
const MetadataForm = require('./metadata/metadata-form')
const { getPaymentLinksSession, metadata } = require('../../utils/payment-links')

const { response } = require('../../utils/response.js')

function addMetadata (req, res) {
  const sessionData = getPaymentLinksSession(req)
  const pageData = {
    self: paths.paymentLinks.addMetadata,
    cancelRoute: paths.paymentLinks.review,
    createLink: true
  }
  const form = new MetadataForm(req.body)
  const validated = form.validate()

  if (validated.errors.length) {
    pageData.tested = validated
    pageData.form = form
    response(req, res, 'payment-links/reporting-columns/edit-reporting-columns', pageData)
    return
  }

  metadata.addMetadata(
    sessionData,
    form.values[form.fields.metadataKey.id],
    form.values[form.fields.metadataValue.id]
  )
  res.redirect(paths.paymentLinks.review)
}

function editMetadata (req, res) {
  const sessionData = getPaymentLinksSession(req)
  const form = new MetadataForm(req.body)
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
  const sessionData = getPaymentLinksSession(req)
  const key = req.params.metadataKey

  metadata.removeMetadata(sessionData, key)
  res.redirect(paths.paymentLinks.review)
}

module.exports = {
  addMetadata,
  editMetadata,
  deleteMetadata
}
