import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { Token } from '@models/Token.class'

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service123abc'
const TOKEN_LINK = 'token456def'
const TOKEN_DESC = 'S MCDUCK API DEV'
const GATEWAY_ACCOUNT_ID = '1337'
const mockResponse = sinon.stub()
const mockApiKeysService = {
  getKeyByTokenLink: sinon.stub().resolves(new Token().withDescription(TOKEN_DESC).withTokenLink(TOKEN_LINK)),
  revokeKey: sinon.stub().resolves(),
}

const { req, res, nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/api-keys/revoke/revoke.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    id: GATEWAY_ACCOUNT_ID,
  })
  .withParams({
    tokenLink: TOKEN_LINK,
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/api-keys.service': mockApiKeysService,
  })
  .build()

describe('Controller: settings/api-keys/revoke', () => {
  describe('get', () => {
    beforeEach(async () => {
      await call('get')
    })

    it('should call getKeyByTokenLink', () => {
      sinon.assert.calledOnceWithExactly(mockApiKeysService.getKeyByTokenLink, GATEWAY_ACCOUNT_ID, TOKEN_LINK)
    })

    it('should call the response method with context', () => {
      sinon.assert.calledOnceWithExactly(mockResponse, req, res, 'simplified-account/settings/api-keys/revoke/index', {
        name: TOKEN_DESC,
        backLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.apiKeys.index,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
        ),
      })
    })
  })

  describe('post', () => {
    describe('when nothing is selected', () => {
      beforeEach(async () => {
        nextRequest({
          body: {},
        })
        await call('post')
      })

      it('should not call revokeKey', () => {
        sinon.assert.notCalled(mockApiKeysService.revokeKey)
        sinon.assert.notCalled(req.flash)
      })

      it('should not redirect the user', () => {
        sinon.assert.notCalled(res.redirect)
      })

      it('should call the response method with errors', () => {
        sinon.assert.calledOnceWithMatch(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/settings/api-keys/revoke/index',
          {
            errors: {
              formErrors: {
                revokeKey: `Confirm if you want to revoke ${TOKEN_DESC}`, // pragma: allowlist secret
              },
              summary: [
                {
                  text: `Confirm if you want to revoke ${TOKEN_DESC}`,
                  href: '#revoke-key',
                },
              ],
            },
            name: TOKEN_DESC,
            backLink: formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.apiKeys.index,
              SERVICE_EXTERNAL_ID,
              ACCOUNT_TYPE
            ),
          }
        )
      })
    })

    describe('when "No" is selected', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            revokeKey: 'no', // pragma: allowlist secret
          },
        })
        await call('post')
      })

      it('should not call revokeKey', () => {
        sinon.assert.notCalled(mockApiKeysService.revokeKey)
        sinon.assert.notCalled(req.flash)
      })

      it('should redirect the user', () => {
        sinon.assert.calledOnceWithExactly(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.apiKeys.index,
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE
          )
        )
      })
    })

    describe('when "Yes" is selected', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            revokeKey: 'yes', // pragma: allowlist secret
          },
        })
        await call('post')
      })

      it('should call revokeKey with args', () => {
        sinon.assert.calledOnceWithExactly(mockApiKeysService.revokeKey, GATEWAY_ACCOUNT_ID, TOKEN_LINK)
        sinon.assert.calledOnceWithExactly(req.flash, 'messages', {
          state: 'success',
          icon: '&check;',
          heading: `${TOKEN_DESC} was successfully revoked`,
        })
      })

      it('should redirect the user', () => {
        sinon.assert.calledOnceWithExactly(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.apiKeys.index,
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE
          )
        )
      })
    })
  })
})
