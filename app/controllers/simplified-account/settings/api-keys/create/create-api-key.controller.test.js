const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { TOKEN_SOURCE } = require('@services/api-keys.service')

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'
const mockResponse = sinon.spy()
const newApiKey = 'api_test_123' // pragma: allowlist secret
const apiKeysService = {
  createApiKey: sinon.stub().resolves(newApiKey),
  TOKEN_SOURCE
}

const {
  req,
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/api-keys/create/create-api-key.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/api-keys.service': apiKeysService
  })
  .build()

describe('Controller: settings/create-api-key', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse).to.have.been.calledOnce // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse).to.have.been.calledWith(req, res, 'simplified-account/settings/api-keys/api-key-name')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(
        formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_ID, ACCOUNT_TYPE))
    })
  })

  describe('post', () => {
    before(() => {
      nextRequest({
        body: {
          description: 'a test api key'
        },
        user: {
          email: 'potter@wand.com'
        }
      })
      call('post')
    })

    it('should submit values to the api keys service', () => {
      expect(apiKeysService.createApiKey).to.have.been.calledWith(
        sinon.match.any,
        'a test api key',
        'potter@wand.com',
        TOKEN_SOURCE.API
      )
    })

    it('should call the response method', () => {
      expect(mockResponse).to.have.been.calledOnce // eslint-disable-line
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/api-keys/new-api-key-details')
      expect(mockResponse.args[0][3]).to.have.property('backToApiKeysLink').to.equal(
        formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_ID, ACCOUNT_TYPE))
      expect(mockResponse.args[0][3]).to.have.property('apiKey').to.equal(newApiKey)
      expect(mockResponse.args[0][3]).to.have.property('description').to.equal('a test api key')
    })
  })
})
