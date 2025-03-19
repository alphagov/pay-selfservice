const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const GatewayAccount = require('@models/GatewayAccount.class')

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'
const GATEWAY_ACCOUNT_ID = 1
const mockResponse = sinon.spy()
const DESCRIPTION = 'My API key description'
const apiKeysService = {
  getKeyByTokenLink: sinon.stub().resolves({ description: DESCRIPTION }),
  changeApiKeyName: sinon.stub().resolves()
}
const {
  req,
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/api-keys/change-name/change-name.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccount(new GatewayAccount({
    type: ACCOUNT_TYPE,
    gateway_account_id: GATEWAY_ACCOUNT_ID
  }))
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/api-keys.service': apiKeysService
  })
  .withParams({ tokenLink: '123-456-abc' })
  .build()

describe('Controller: settings/api-keys/change-name', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should get api key and call the response method', () => {
      expect(apiKeysService.getKeyByTokenLink).to.have.been.calledWith(1, '123-456-abc')
      expect(mockResponse).to.have.been.calledOnce // eslint-disable-line
    })

    it('should pass req, res, template path and context to the response method', () => {
      expect(mockResponse).to.have.been.calledWith(req, res, 'simplified-account/settings/api-keys/api-key-name',
        {
          description: DESCRIPTION,
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_ID, ACCOUNT_TYPE)
        })
    })
  })

  describe('post', () => {
    describe('a valid description', () => {
      before(() => {
        nextRequest({
          body: {
            description: 'a test api key'
          }
        })
        call('post')
      })

      it('should submit values to the api keys service', () => {
        expect(apiKeysService.changeApiKeyName).to.have.been.calledWith('123-456-abc', 'a test api key')
      })

      it('should redirect to the api keys index page', () => {
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_ID, ACCOUNT_TYPE)
        )
      })
    })

    describe('an invalid description', () => {
      before(() => {
        nextRequest({
          body: {
            description: ''
          }
        })
        call('post')
      })

      it('should not call apiKeysService.changeApiKeyName', () => {
        sinon.assert.notCalled(apiKeysService.changeApiKeyName)
      })

      it('should pass req, res, template path and context to the response method', () => {
        expect(mockResponse.calledOnce).to.be.true // eslint-disable-line
        expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/api-keys/api-key-name')
        expect(mockResponse.args[0][3].errors.summary[0].text).to.equal('Enter the API key name')
        expect(mockResponse.args[0][3].errors.formErrors.description).to.equal('Enter the API key name')
        expect(mockResponse.args[0][3].backLink).to.equal(
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_ID, ACCOUNT_TYPE))
      })
    })
  })
})
