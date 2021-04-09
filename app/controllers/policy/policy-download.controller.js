'use strict'

const logger = require('../../utils/logger')(__filename)
const { response, renderErrorView } = require('../../utils/response')

const supportedPolicyDocuments = require('./supported-policy-documents')
const policyBucket = require('./aws-s3-policy-bucket')

const downloadDocumentsPolicyPage = async function downloadDocumentsPolicyPage (req, res, next) {
  const key = req.params.key

  try {
    const documentConfig = await supportedPolicyDocuments.lookup(key)
    const link = await policyBucket.generatePrivateLink(documentConfig)

    logger.info(`User ${req.user.externalId} signed private link for ${key}: ${link}`)
    return response(req, res, documentConfig.template, { link })
  } catch (error) {
    logger.error(`Unable to generate document link ${error.message}`)
    renderErrorView(req, res, error.message)
  }
}

module.exports = downloadDocumentsPolicyPage
