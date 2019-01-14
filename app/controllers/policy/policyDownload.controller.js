'use strict'

const { response, renderErrorView } = require('../../utils/response')

const supportedPolicyDocuments = require('./supportedPolicyDocuments')
const policyBucket = require('./awsS3PolicyBucket')

const downloadDocumentsPolicyPage = async function downloadDocumentsPolicyPage (req, res, next) {
  const key = req.params.key

  try {
    const documentConfig = await supportedPolicyDocuments.lookup(key)
    const link = await policyBucket.generatePrivateLink(documentConfig.key)

    return response(req, res, document.template, { link })
  } catch (error) {
    renderErrorView(req, res, error.message)
  }
}

module.exports = downloadDocumentsPolicyPage
