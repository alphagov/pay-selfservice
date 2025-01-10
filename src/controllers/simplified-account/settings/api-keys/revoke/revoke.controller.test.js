const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const GatewayAccount = require('@models/GatewayAccount.class')

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'
const TOKEN_LINK = '550e8400-e29b-41d4-a716-446655440000'
const GATEWAY_ACCOUNT_ID = 1
const mockResponse = sinon.spy()
const token = {
  description: 'token description',
  token_link: TOKEN_LINK
}
const apiKeysService = {
  getKeyByTokenLink: sinon.stub().resolves(token),
  revokeKey: sinon.stub().resolves()
}

const {
  req,
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/api-keys/revoke/revoke.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccount(new GatewayAccount({
    type: ACCOUNT_TYPE,
    gateway_account_id: GATEWAY_ACCOUNT_ID
  }))
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/api-keys.service': apiKeysService
  })
  .build()

describe('Controller: settings/api-keys/revoke', () => {
  describe('get', () => {
    before(() => {
      nextRequest({
        params: {
          tokenLink: TOKEN_LINK
        }
      })
      call('get')
    })

    it('should call apiKeysService.getKeyByTokenLink', () => {
      expect(apiKeysService.getKeyByTokenLink).to.have.been.calledWith(GATEWAY_ACCOUNT_ID, TOKEN_LINK)
    })

    it('should call the response method', () => {
      expect(mockResponse).to.have.been.calledOnce // eslint-disable-line
    })

    it('should pass req, res, template path and context to the response method', () => {
      expect(mockResponse).to.have.been.calledWith(
        { ...req, params: { tokenLink: TOKEN_LINK } },
        res,
        'simplified-account/settings/api-keys/revoke',
        {
          description: token.description,
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_ID, ACCOUNT_TYPE)
        })
    })
  })

  describe('post', () => {
    describe('when No is selected', () => {
      before(() => {
        nextRequest({
          body: {
            revokeApiKey: 'No'
          },
          params: {
            tokenLink: TOKEN_LINK
          }
        })
        call('post')
      })

      it('should not call apiKeysService.revokeKey', () => {
        sinon.assert.notCalled(apiKeysService.revokeKey)
      })

      it('should redirect to the api keys index page', () => {
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_ID, ACCOUNT_TYPE)
        )
      })
    })

    describe('when Yes is selected', () => {
      before(() => {
        nextRequest({
          body: {
            revokeApiKey: 'Yes' // pragma: allowlist secret
          },
          params: {
            tokenLink: TOKEN_LINK
          }
        })
        call('post')
      })

      it('should call apiKeysService.revokeKey', () => {
        expect(apiKeysService.revokeKey).to.have.been.calledWith(GATEWAY_ACCOUNT_ID, TOKEN_LINK)
      })

      it('should redirect to the api keys index page', () => {
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_ID, ACCOUNT_TYPE)
        )
      })
    })
  })
})
