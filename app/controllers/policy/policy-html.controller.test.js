'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const supportedPolicyDocuments = require('./supported-policy-documents')
const getController = function getController (mockBucket) {
  return proxyquire('./policy-html.controller', {
    './aws-s3-policy-bucket': mockBucket
  })
}

describe('policy HTML download controller', () => {
  let req, res, next, documentConfig
  const key = 'stripe-connected-account-agreement'
  beforeEach(() => {
    req = {
      params: {
        key: key
      }
    }
    res = sinon.spy()
    next = sinon.spy()
  })

  describe('download HTML document', () => {
    const mockBucketService = sinon.spy(() => {
      return new Promise(resolve => {
        resolve('html-url-link')
      })
    })
    const mockBucketServiceService = {
      generatePrivateLink: mockBucketService,
      getDocumentHtmlFromS3: mockBucketService
    }
    const controller = getController(mockBucketServiceService)
    it('should call s3 policy bucket for private link and download document', async function () {
      documentConfig = await supportedPolicyDocuments.lookup(key)
      await controller(req, res, next)

      sinon.assert.calledWith(mockBucketServiceService.generatePrivateLink, documentConfig)
      sinon.assert.calledWith(mockBucketServiceService.getDocumentHtmlFromS3, documentConfig)
    })
  })
})
