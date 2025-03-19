const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { TOKEN_SOURCE } = require('@services/api-keys.service')
const _ = require('lodash')
const { FORM_STATE_KEY } = require('@controllers/simplified-account/settings/api-keys/create/constants')

const GATEWAY_ACCOUNT = {
  type: 'live',
  id: '1337'
}
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const NEW_API_KEY = 'api_live_123' // pragma: allowlist secret
const mockResponse = sinon.spy()
const mockApiKeysService = {
  createKey: sinon.stub().resolves(NEW_API_KEY),
  TOKEN_SOURCE
}

const {
  req,
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/api-keys/create/create-key.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser({
    email: 'potter@wand.com'
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/api-keys.service': mockApiKeysService
  })
  .build()

describe('Controller: settings/api-keys/create', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method with context', () => {
      sinon.assert.calledOnceWithExactly(mockResponse,
        req,
        res,
        'simplified-account/settings/api-keys/create/index',
        {
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_EXTERNAL_ID, GATEWAY_ACCOUNT.type)
        }
      )
    })
  })

  describe('post', () => {
    describe('a valid key name', () => {
      let thisCall
      before(async () => {
        nextRequest({
          body: {
            keyName: 'a test api key'
          }
        })
        thisCall = await call('post')
      })

      it('should call createKey with args', () => {
        sinon.assert.calledOnceWithExactly(mockApiKeysService.createKey,
          GATEWAY_ACCOUNT,
          'a test api key',
          'potter@wand.com',
          TOKEN_SOURCE.API
        )
      })

      it('should set key details on the session', async () => {
        const expectedSessionState = {
          details: {
            name: 'a test api key',
            key: NEW_API_KEY
          }
        }
        expect(_.get(thisCall.req, FORM_STATE_KEY)).to.deep.equal(expectedSessionState)
      })

      it('should redirect the user', async () => {
        sinon.assert.calledOnceWithExactly(thisCall.res.redirect,
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.create.newKeyDetails, SERVICE_EXTERNAL_ID, GATEWAY_ACCOUNT.type)
        )
      })
    })

    describe('an invalid key name', () => {
      [
        {
          testDescription: 'empty',
          keyNameInput: '',
          expectedError: 'Enter the API key name'
        },
        {
          testDescription: 'more than 50 chars',
          keyNameInput: 'more than fifty chars more than fifty chars more than fifty chars more than fifty chars',
          expectedError: 'Name must be 50 characters or fewer'
        }
      ].forEach(({ testDescription, keyNameInput, expectedError }) => {
        describe(testDescription, () => {
          before(() => {
            nextRequest({
              body: {
                keyName: keyNameInput
              }
            })
            call('post')
          })

          it('should not call createKey', () => {
            sinon.assert.notCalled(mockApiKeysService.createKey)
          })

          it('should not redirect the user', () => {
            sinon.assert.notCalled(res.redirect)
          })

          it('should call the response method with errors', () => {
            sinon.assert.calledWithMatch(mockResponse,
              sinon.match.any,
              sinon.match.any,
              'simplified-account/settings/api-keys/create/index',
              {
                errors: {
                  formErrors: {
                    keyName: expectedError
                  },
                  summary: [{
                    text: expectedError,
                    href: '#key-name'
                  }]
                },
                currentKeyName: keyNameInput,
                backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_EXTERNAL_ID, GATEWAY_ACCOUNT.type)
              }
            )
          })
        })
      })
    })
  })
})
