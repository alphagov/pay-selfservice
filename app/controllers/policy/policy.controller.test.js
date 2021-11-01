'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const supportedPolicyDocuments = require('./supported-policy-documents')

const getController = function getController (mockBucket) {
  return proxyquire('./policy.controller', {
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
    const mockBucketGetLinkToPdf = sinon.spy(() => {
      return new Promise(resolve => {
        resolve('html-url-link')
      })
    })
    const mockBucketGetHTMLContent = sinon.spy(() => {
      return new Promise(resolve => {
        resolve('html content')
      })
    })
    const mockBucketService = {
      generatePrivateLink: mockBucketGetLinkToPdf,
      getDocumentHtmlFromS3: mockBucketGetHTMLContent
    }
    const controller = getController(mockBucketService)
    it('should call s3 policy bucket for private link and download document', async function () {
      documentConfig = await supportedPolicyDocuments.lookup(key)
      await controller(req, res, next)

      sinon.assert.calledWith(mockBucketService.generatePrivateLink, documentConfig)
      sinon.assert.calledWith(mockBucketService.getDocumentHtmlFromS3, documentConfig)
      sinon.assert.calledWith(res.render, 'policy/document/stripe-connected-account-agreement',
        sinon.match({
          link: 'html-url-link',
          contentHtml: 'html content'
        }))
      sinon.assert.notCalled(res.redirect)
      sinon.assert.notCalled(next)
    })
  })

  describe('policy link download handle error', () => {
    const mockBucketGetLinkToPdf = sinon.spy(() => {
      return new Promise((resolve, reject) => {
        const error = new Error()
        error.code = '404'
        error.message = 'invalid path'
        reject(error)
      })
    })
    const mockBucketService = {
      generatePrivateLink: mockBucketGetLinkToPdf,
      getDocumentHtmlFromS3: sinon.spy()
    }
    const controller = getController(mockBucketService)
    it('should handle error with grace', async function () {
      documentConfig = await supportedPolicyDocuments.lookup(key)
      await controller(req, res, next)

      sinon.assert.calledWith(mockBucketService.generatePrivateLink, documentConfig)
      sinon.assert.notCalled(mockBucketService.getDocumentHtmlFromS3)
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
      sinon.assert.called(next)
    })
  })

  describe('policy HTML download handle error', () => {
    const mockBucketGetLinkToPdf = sinon.spy(() => {
      return new Promise(resolve => {
        resolve('html-url-link')
      })
    })
    const mockBucketGetHTMLContent = sinon.spy(() => {
      return new Promise((resolve, reject) => {
        const error = new Error()
        error.code = '404'
        error.message = 'invalid path'
        reject(error)
      })
    })
    const mockBucketService = {
      generatePrivateLink: mockBucketGetLinkToPdf,
      getDocumentHtmlFromS3: mockBucketGetHTMLContent
    }
    const controller = getController(mockBucketService)
    it('should render page with link', async function () {
      documentConfig = await supportedPolicyDocuments.lookup(key)
      await controller(req, res, next)

      sinon.assert.calledWith(mockBucketService.generatePrivateLink, documentConfig)
      sinon.assert.calledWith(mockBucketService.getDocumentHtmlFromS3, documentConfig)
      sinon.assert.calledWith(res.render, 'policy/document/stripe-connected-account-agreement',
        sinon.match({
          link: 'html-url-link',
          contentHtml: 'Error displaying content'
        }))
      sinon.assert.notCalled(res.redirect)
      sinon.assert.notCalled(next)
    })
  })
})
