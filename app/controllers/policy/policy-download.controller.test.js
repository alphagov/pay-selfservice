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
      }
    }
    res = sinon.spy()
    next = sinon.spy()
  })

  describe('download document', () => {
    const mockBucketService = sinon.spy(() => {
      return new Promise(resolve => {
        resolve('download-url-link')
      })
    })
    const mockBucketServiceService = {
      generatePrivateLink: mockBucketService
    }
    const controller = getController(mockBucketServiceService)
    it('should call s3 policy bucket for private link', async function () {
      documentConfig = await supportedPolicyDocuments.lookup(key)
      await controller(req, res, next)

      sinon.assert.calledWith(mockBucketServiceService.generatePrivateLink, documentConfig)
    })
  })
})
