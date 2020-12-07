'use strict'

const paths = require('../../paths')
const MetadataForm = require('./metadata/metadata-form')

const { response } = require('../../utils/response.js')

module.exports = function showAddMetadataPage (req, res) {
  const pageData = {
    form: new MetadataForm(),
    self: paths.paymentLinks.addMetadata,
    cancelRoute: paths.paymentLinks.review
  }
  return response(req, res, 'payment-links/reporting-columns/edit-reporting-columns', pageData)
}
