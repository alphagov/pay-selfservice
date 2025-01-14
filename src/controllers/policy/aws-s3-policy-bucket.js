'use strict'

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const logger = require('../../utils/logger')(__filename)

// AWS S3 SDK is configured based on the production environment of the service
const s3Client = new S3Client()

const bucketName = process.env.AWS_S3_POLICY_DOCUMENTS_BUCKET_NAME
const environmentVariablesSet =
  bucketName &&
  (process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI || (process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_ACCESS_KEY))

const s3BucketConfig = {
  Bucket: bucketName
}

if (!environmentVariablesSet) {
  logger.warn('AWS policy documents S3 Bucket environment not configured')
}

const generatePrivateLink = async function generatePrivateLink (documentConfig) {
  // S3 Bucket documents are uploaded directly, the key will include file extension
  const Key = `${documentConfig.key}.pdf`
  const ResponseContentDisposition = `attachment; filename="${documentConfig.title}.pdf"`
  const params = {
    ...s3BucketConfig,
    Key,
    ResponseContentDisposition,
    // signed URL expiration in seconds
    Expires: 60 * 60
  }
  const command = new GetObjectCommand(params)
  return getSignedUrl(s3Client, command, { expiresIn: 60 * 60 })
    .catch(error => {
      throw new Error(`Policy documents storage error: ${error.message}`)
    })
}

module.exports = {
  generatePrivateLink
}
