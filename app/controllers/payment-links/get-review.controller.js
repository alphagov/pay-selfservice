'use strict'

const lodash = require('lodash')

const paths = require('../../paths')

const { response } = require('../../utils/response.js')

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})

  return response(req, res, 'payment-links/review', {
    pageData,
    addMetadata: paths.paymentLinks.addMetadata,
    editMetadata: paths.paymentLinks.editMetadata,
    metadata: pageData.metadata
  })
}
