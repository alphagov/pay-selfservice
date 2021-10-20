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
      },
      user: {
        externalId: 'user-id'
      }
    }
    res = {
      render: sinon.spy(),
      redirect: sinon.spy()
    }
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
      sinon.assert.calledWith(res.render, 'policy/document-html/stripe-connected-account-agreement',
        sinon.match({
          link: 'html-url-link'
        }))
    })
  })

  describe('policy HTML download handle error', () => {
    const mockBucketService = sinon.spy(() => {
      return new Promise((resolve, reject) => {
        const error = new Error()
        error.code = '404'
        error.message = 'invalid path'
        reject(error)
      })
    })
    const mockBucketServiceService = {
      generatePrivateLink: mockBucketService,
      getDocumentHtmlFromS3: sinon.spy()
    }
    const controller = getController(mockBucketServiceService)
    it('should handle error with grace', async function () {
      documentConfig = await supportedPolicyDocuments.lookup(key)
      await controller(req, res, next)

      sinon.assert.calledWith(mockBucketServiceService.generatePrivateLink, documentConfig)
      sinon.assert.notCalled(mockBucketServiceService.getDocumentHtmlFromS3)
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
      sinon.assert.called(next)
    })
  })
})
