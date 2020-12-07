'use strict'

const lodash = require('lodash')
const paths = require('../../paths')
const MetadataForm = require('./metadata/metadata-form')

const { response } = require('../../utils/response.js')

module.exports = function addMetadata (req, res) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  const pageData = {
    self: paths.paymentLinks.addMetadata,
    cancelRoute: paths.paymentLinks.review
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
