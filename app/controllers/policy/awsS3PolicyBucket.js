'use strict'

const AWS = require('aws-sdk')
const logger = require('winston')

// AWS S3 SDK is configured based on the production environment of the service
const s3 = new AWS.S3()

const bucketName = process.env.AWS_S3_POLICY_DOCUMENTS_BUCKET_NAME
const environmentVariablesSet =
  bucketName &&
  (process.env.AWS_CREDENTIALS_URL || (process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_ACCESS_KEY))

const s3BucketConfig = {
  Bucket: bucketName,

  // signed URL expiration in seconds
  Expires: 60 * 5
}

if (!environmentVariablesSet) {
  logger.warn('AWS policy documents S3 Bucket environment not configured')
}

const generatePrivateLink = async function generatePrivateLink (Key) {
  const config = Object.assign({}, s3BucketConfig, { Key })

  return getSignedUrl('getObject', config)
}

// wrap AWS SDK callback to work with library Promise async standards
const getSignedUrl = (key, config) => new Promise((resolve, reject) => {
  s3.getSignedUrl(key, config, (error, url) => {
    if (error) reject(new Error(`Policy documents storage error: ${error.message}`))
    else resolve(url)
  })
})

module.exports = { generatePrivateLink }
