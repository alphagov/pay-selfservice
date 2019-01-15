'use strict'

const logger = require('winston')
const { response, renderErrorView } = require('../../utils/response')

const supportedPolicyDocuments = require('./supportedPolicyDocuments')
const policyBucket = require('./awsS3PolicyBucket')

const downloadDocumentsPolicyPage = async function downloadDocumentsPolicyPage (req, res, next) {
  const key = req.params.key

  try {
    const documentConfig = await supportedPolicyDocuments.lookup(key)
    const link = await policyBucket.generatePrivateLink(documentConfig.key)

    return response(req, res, documentConfig.template, { link })
  } catch (error) {
    console.log(error)
    logger.error(error)
    renderErrorView(req, res, error.message)
  }
}

module.exports = downloadDocumentsPolicyPage
