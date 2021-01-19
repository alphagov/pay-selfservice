'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

const { response } = require('../../utils/response.js')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})

  return response(req, res, 'payment-links/review', {
    pageData,
    addMetadata: formatAccountPathsFor(paths.account.paymentLinks.addMetadata, req.account && req.account.external_id),
    editMetadata: formatAccountPathsFor(paths.account.paymentLinks.editMetadata, req.account && req.account.external_id),
    metadata: pageData.metadata
  })
}
