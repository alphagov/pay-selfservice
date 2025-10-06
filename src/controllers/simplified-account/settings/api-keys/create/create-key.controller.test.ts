import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon, { SinonSpyCall } from 'sinon'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { expect } from 'chai'
import { FORM_STATE_KEY } from '@controllers/simplified-account/settings/api-keys/create/constants'
import _ from 'lodash'
import TokenUsageType from '@models/public-auth/token-usage-type'
import { CreateTokenRequest } from '@models/public-auth/CreateTokenRequest.class'

const GATEWAY_ACCOUNT_ID = '1337'
const ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT = {
  id: GATEWAY_ACCOUNT_ID,
  type: ACCOUNT_TYPE,
}
const SERVICE_EXTERNAL_ID = 'service123abc'
const NEW_API_KEY = 'api_live_123' // pragma: allowlist secret
const mockResponse = sinon.stub()
const createTokenStub = sinon.stub().resolves(NEW_API_KEY)

const { req, res, nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/api-keys/create/create-key.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser({
    email: 'potter@wand.com',
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/tokens.service': { createToken: createTokenStub },
  })
  .build()

describe('Controller: settings/api-keys/create', () => {
  describe('get', () => {
    beforeEach(async () => {
      await call('get')
    })

    it('should call the response method with context', () => {
      sinon.assert.calledOnceWithExactly(mockResponse, req, res, 'simplified-account/settings/api-keys/create/index', {
        backLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.apiKeys.index,
          SERVICE_EXTERNAL_ID,
          GATEWAY_ACCOUNT.type
        ),
      })
    })
  })

  describe('post', () => {
    describe('a valid key name', () => {
      let thisCall: { req: unknown; res: { redirect: SinonSpyCall } }
      beforeEach(async () => {
        nextRequest({
          body: {
            keyName: 'a test api key',
          },
        })
        thisCall = await call('post')
      })

      it('should call createKey with args', () => {
        createTokenStub.should.have.been.calledOnce
        createTokenStub.should.have.been.calledWith(
          new CreateTokenRequest()
            .withGatewayAccountId(GATEWAY_ACCOUNT_ID)
            .withServiceExternalId(SERVICE_EXTERNAL_ID)
            .withServiceMode(GATEWAY_ACCOUNT.type)
            .withDescription('a test api key')
            .withCreatedBy('potter@wand.com')
            .withTokenUsageType(TokenUsageType.API)
            .withTokenType('CARD')
            .withTokenAccountType(ACCOUNT_TYPE)
        )
      })

      it('should set key details on the session', () => {
        const expectedSessionState = {
          details: {
            name: 'a test api key',
            key: NEW_API_KEY,
          },
        }
        expect(_.get(thisCall.req, FORM_STATE_KEY)).to.deep.equal(expectedSessionState)
      })

      it('should redirect the user', () => {
        sinon.assert.calledOnceWithExactly(
          thisCall.res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.apiKeys.create.newKeyDetails,
            SERVICE_EXTERNAL_ID,
            GATEWAY_ACCOUNT.type
          )
        )
      })
    })

    describe('an invalid key name', () => {
      ;[
        {
          testDescription: 'empty',
          keyNameInput: '',
          expectedError: 'Enter the API key name',
        },
        {
          testDescription: 'more than 50 chars',
          keyNameInput: 'more than fifty chars more than fifty chars more than fifty chars more than fifty chars',
          expectedError: 'Name must be 50 characters or fewer',
        },
      ].forEach(({ testDescription, keyNameInput, expectedError }) => {
        describe(testDescription, () => {
          beforeEach(async () => {
            nextRequest({
              body: {
                keyName: keyNameInput,
              },
            })
            await call('post')
          })

          it('should not call createKey', () => {
            createTokenStub.should.not.have.been.called
          })

          it('should not redirect the user', () => {
            sinon.assert.notCalled(res.redirect)
          })

          it('should call the response method with errors', () => {
            sinon.assert.calledWithMatch(
              mockResponse,
              sinon.match.any,
              sinon.match.any,
              'simplified-account/settings/api-keys/create/index',
              {
                errors: {
                  formErrors: {
                    keyName: expectedError,
                  },
                  summary: [
                    {
                      text: expectedError,
                      href: '#key-name',
                    },
                  ],
                },
                currentKeyName: keyNameInput,
                backLink: formatServiceAndAccountPathsFor(
                  paths.simplifiedAccount.settings.apiKeys.index,
                  SERVICE_EXTERNAL_ID,
                  GATEWAY_ACCOUNT.type
                ),
              }
            )
          })
        })
      })
    })
  })
})
