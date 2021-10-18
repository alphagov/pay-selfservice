'use strict'

const AWS = require('aws-sdk')
const logger = require('../../utils/logger')(__filename)

// AWS S3 SDK is configured based on the production environment of the service
const s3 = new AWS.S3()

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
  return getSignedUrl('getObject', params)
}

// wrap AWS SDK callback to work with library Promise async standards
const getSignedUrl = (key, config) => new Promise((resolve, reject) => {
  s3.getSignedUrl(key, config, (error, url) => {
    if (error) {
      reject(new Error(`Policy documents storage error: ${error.message}`))
    } else {
      resolve(url)
    }
  })
})

function getDocumentHtmlFromS3 (documentConfig) {
  const params = {
    ...s3BucketConfig,
    Key: `${documentConfig.key}.html`
  }
  return new Promise((resolve, reject) => {
    s3.getObject(params, function (error, data) {
      if (error) {
        reject(new Error(`Error getting policy document HTML: ${error.message}`))
      } else {
        resolve(data.Body.toString('utf-8'))
      }
    })
  })
}

module.exports = {
  generatePrivateLink,
  getDocumentHtmlFromS3
}
