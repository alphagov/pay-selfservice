'use strict'

const logger = require('../../utils/logger')(__filename)
const { response } = require('../../utils/response')

const supportedPolicyDocuments = require('./supported-policy-documents')
const policyBucket = require('./aws-s3-policy-bucket')

async function getDocumentHtml (documentConfig, key) {
  let contentHtml
  try {
    contentHtml = await policyBucket.getDocumentHtmlFromS3(documentConfig)
  } catch (err) {
    logger.error(`Error getting HTML content for ${key}, error: ${err.message}`)
    contentHtml = 'Error displaying content'
  }
  return contentHtml
}

async function downloadDocumentsPolicyPage (req, res, next) {
  const key = req.params.key
  try {
    const documentConfig = await supportedPolicyDocuments.lookup(key)

    const link = await policyBucket.generatePrivateLink(documentConfig)
    logger.info(`User ${req.user.externalId} signed private link for ${key}: ${link}`)

    const contentHtml = await getDocumentHtml(documentConfig, key)

    return response(req, res, documentConfig.htmlTemplate, { link, contentHtml })
  } catch (err) {
    next(err)
  }
}

module.exports = downloadDocumentsPolicyPage
