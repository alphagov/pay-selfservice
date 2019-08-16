'use strict'

const { createLogger, format } = require('winston')
const { timestamp, json } = format
const logger = createLogger({
  format: format.combine(
    timestamp(),
    json()
  )
})
const { response, renderErrorView } = require('../../utils/response')

const supportedPolicyDocuments = require('./supportedPolicyDocuments')
const policyBucket = require('./awsS3PolicyBucket')

const downloadDocumentsPolicyPage = async function downloadDocumentsPolicyPage (req, res, next) {
  const key = req.params.key

  try {
    const documentConfig = await supportedPolicyDocuments.lookup(key)
    const link = await policyBucket.generatePrivateLink(documentConfig)

    logger.info(`[${req.correlationId}] user ${req.user.externalId} signed private link for ${key}: ${link}`)
    return response(req, res, documentConfig.template, { link })
  } catch (error) {
    logger.error(`[${req.correlationId}] unable to generate document link ${error.message}`)
    renderErrorView(req, res, error.message)
  }
}

module.exports = downloadDocumentsPolicyPage
