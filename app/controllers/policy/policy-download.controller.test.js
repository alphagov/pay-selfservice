'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const supportedPolicyDocuments = require('./supported-policy-documents')
const getController = function getController (mockBucket) {
  return proxyquire('./policy-download.controller', {
    './aws-s3-policy-bucket': mockBucket
  })
}

describe('policy download controller', () => {
  let req, res, next, documentConfig
  const key = 'pci-dss-attestation-of-compliance'
  beforeEach(() => {
    req = {
      params: {
        key: key
      },
      user: {
        externalId: 'id-baby'
      }
    }
    res = {
      render: sinon.spy(),
      redirect: sinon.spy()
    }
    next = sinon.spy()
  })

  describe('download document', () => {
    const mockBucketGetLinkToPdf = sinon.spy(() => {
      return new Promise(resolve => {
        resolve('download-url-link')
      })
    })
    const mockBucketService = {
      generatePrivateLink: mockBucketGetLinkToPdf
    }
    const controller = getController(mockBucketService)
    it('should call s3 policy bucket for private link', async function () {
      documentConfig = await supportedPolicyDocuments.lookup(key)
      await controller(req, res, next)
      sinon.assert.calledWith(mockBucketService.generatePrivateLink, documentConfig)
      sinon.assert.calledWith(res.render, 'policy/document-downloads/pci-dss-attestation-of-compliance',
        sinon.match({
          link: 'download-url-link'
        }))
      sinon.assert.notCalled(res.redirect)
      sinon.assert.notCalled(next)
    })
  })

  describe('policy download handle error', () => {
    const mockBucketService = sinon.spy(() => {
      return new Promise((resolve, reject) => {
        const error = new Error()
        error.code = '404'
        error.message = 'invalid path'
        reject(error)
      })
    })
    const mockBucketServiceService = {
      generatePrivateLink: mockBucketService
    }
    const controller = getController(mockBucketServiceService)
    it('should handle error with grace', async function () {
      documentConfig = await supportedPolicyDocuments.lookup(key)
      await controller(req, res, next)

      sinon.assert.calledWith(mockBucketServiceService.generatePrivateLink, documentConfig)
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
      sinon.assert.called(next)
    })
  })
})
