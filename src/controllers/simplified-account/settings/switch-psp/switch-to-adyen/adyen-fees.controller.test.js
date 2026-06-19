const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const supportedPolicyDocuments = require('@controllers/policy/supported-policy-documents')

const mockResponse = sinon.stub()

const mockBucketGetLinkToPdf = sinon.spy(() => {
  return new Promise((resolve) => {
    resolve('html-url-link')
  })
})

const mockBucketService = {
  generatePrivateLink: mockBucketGetLinkToPdf,
}

const { req, res, next, nextRequest, nextResponse, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/switch-psp/switch-to-adyen/adyen-fees.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@controllers/policy/aws-s3-policy-bucket': mockBucketService,
  })
  .build()

let documentConfig

describe('Controller: settings/switch-psp/switch-to-adyen/adyen-fees', () => {
  before(async () => {
    documentConfig = await supportedPolicyDocuments.lookup('adyen-fees-2026')
  })
  it('should call s3 policy bucket for private link and download document', async function () {
    await call('get')
    sinon.assert.calledWith(mockBucketService.generatePrivateLink, documentConfig)
  })

  it('should call the response method', async () => {
    await call('get')
    sinon.assert.calledOnce(mockResponse)
    sinon.assert.notCalled(next)
  })

  it('should pass req, res and template path to the response method', async () => {
    await call('get')
    sinon.assert.calledWith(mockResponse, req, res, 'simplified-account/settings/switch-psp/switch-to-adyen/adyen-fees')
  })

  it('should pass the context data to the response method', async () => {
    await call('get')
    const context = mockResponse.args[0][3]
    sinon.assert.match(context, {
      downloadLink: 'html-url-link',
    })
  })

  it('should handle error', async () => {
    mockBucketService.generatePrivateLink = sinon.spy(() => {
      return new Promise((resolve, reject) => {
        const error = new Error()
        error.code = '404'
        error.message = 'invalid path'
        reject(error)
      })
    })
    await call('get')
    sinon.assert.notCalled(mockResponse)
    sinon.assert.called(next)
  })
})
