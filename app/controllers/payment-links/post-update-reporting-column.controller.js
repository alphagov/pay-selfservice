'use strict'

const lodash = require('lodash')
const paths = require('../../paths')
const MetadataForm = require('./metadata/metadata-form')

const { response } = require('../../utils/response.js')

function addMetadata (req, res) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
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

  const reportingColumnToAdd = {}
  reportingColumnToAdd[form.values[form.fields.metadataKey.id]] = form.values[form.fields.metadataValue.id]
  sessionData.metadata = {
    ...sessionData.metadata,
    ...reportingColumnToAdd
  }

  res.redirect(paths.paymentLinks.review)
}

// @TMP(sfount)
// editing and adding locally are functionally equivalent, for validation (which currently doesn't happen for existing keys!) it should remove
// the key being edited from a COPY of the metadata to make sure the validation doesn't think we're failing to override
// to allow editing of the key, the requested key can be removed and a new key (which can be the same!) is added
function editMetadata (req, res) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
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

  const reportingColumnToAdd = {}
  reportingColumnToAdd[form.values[form.fields.metadataKey.id]] = form.values[form.fields.metadataValue.id]

  delete sessionData.metadata[key]
  sessionData.metadata = {
    ...sessionData.metadata,
    ...reportingColumnToAdd
  }
  res.redirect(paths.paymentLinks.review)
}

function deleteMetadata (req, res) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  const key = req.params.metadataKey

  if (sessionData.metadata) {
    delete sessionData.metadata[key]
  }
  res.redirect(paths.paymentLinks.review)
}

module.exports = {
  addMetadata,
  editMetadata,
  deleteMetadata
}
