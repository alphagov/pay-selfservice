const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { Token } = require('@models/Token.class')

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service123abc'
const TOKEN_LINK = 'token456def'
const TOKEN_DESC = 'S MCDUCK API DEV'
const mockResponse = sinon.stub()
const mockApiKeysService = {
  changeKeyName: sinon.stub().resolves(),
  getKeyByTokenLink: sinon.stub().resolves(new Token()
    .withTokenLink(TOKEN_LINK)
    .withDescription(TOKEN_DESC))
}
const {
  req,
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/api-keys/edit/change-name.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/api-keys.service': mockApiKeysService
  })
  .build()

describe('Controller: settings/api-keys/change-name', () => {
  describe('get', () => {
    beforeEach(async () => {
      await call('get')
    })

    it('should call the response method with context', () => {
      sinon.assert.calledOnceWithExactly(mockResponse,
        req,
        res,
        'simplified-account/settings/api-keys/edit/change-name',
        {
          currentKeyName: TOKEN_DESC,
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        }
      )
    })
  })

  describe('post', () => {
    describe('a valid key name', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            keyName: 'S MCDUCK API PROD'
          },
          params: {
            tokenLink: TOKEN_LINK
          }
        })
        await call('post')
      })

      it('should call changeKeyName with args', () => {
        sinon.assert.calledOnceWithExactly(mockApiKeysService.changeKeyName,
          TOKEN_LINK,
          'S MCDUCK API PROD'
        )
      })

      it('should redirect the user', () => {
        sinon.assert.calledOnceWithExactly(res.redirect,
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        )
      })
    })

    describe('an invalid key name', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            keyName: ''
          },
          params: {
            tokenLink: TOKEN_LINK
          }
        })
        await call('post')
      })

      it('should not call changeKeyName', () => {
        sinon.assert.notCalled(mockApiKeysService.changeKeyName)
      })

      it('should not redirect the user', () => {
        sinon.assert.notCalled(res.redirect)
      })

      it('should call the response method with errors', () => {
        sinon.assert.calledWithMatch(mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/settings/api-keys/edit/change-name',
          {
            errors: {
              formErrors: {
                keyName: 'Enter the API key name'
              },
              summary: [{
                text: 'Enter the API key name',
                href: '#key-name'
              }]
            },
            currentKeyName: '',
            backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
          }
        )
      })
    })
  })
})
