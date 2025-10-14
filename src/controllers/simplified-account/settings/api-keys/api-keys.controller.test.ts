import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'

const ACCOUNT_TYPE = 'live'
const ACCOUNT_ID = '1337'
const SERVICE_EXTERNAL_ID = 'service123abc'

const mockResponse = sinon.stub()
const apiKeys = [
  {
    description: 'my token',
    createdBy: 'system generated',
    issuedDate: '12 Dec 2024',
    tokenLink: '123-345',
  },
]
const mockApiKeysService = {
  getActiveTokens: sinon.stub().resolves(apiKeys),
  getRevokedTokens: sinon.stub().resolves([]),
}

const { req, res, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/api-keys/api-keys.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    id: ACCOUNT_ID,
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/tokens.service': mockApiKeysService,
  })
  .build()

describe('Controller: settings/api-keys', () => {
  describe('get', () => {
    beforeEach(async () => {
      await call('get')
    })

    it('should call apiKeysService', () => {
      sinon.assert.calledOnceWithExactly(mockApiKeysService.getActiveTokens, ACCOUNT_ID)
      sinon.assert.calledOnceWithExactly(mockApiKeysService.getRevokedTokens, ACCOUNT_ID)
    })

    it('should call the response method with context', () => {
      sinon.assert.calledOnceWithExactly(mockResponse, req, res, 'simplified-account/settings/api-keys/index', {
        messages: [],
        accountType: ACCOUNT_TYPE,
        activeKeys: [
          {
            description: 'my token',
            createdBy: 'system generated',
            issuedDate: '12 Dec 2024',
            tokenLink: '123-345',
            changeNameLink: '/service/service123abc/account/live/settings/api-keys/123-345/change-name',
            revokeKeyLink: '/service/service123abc/account/live/settings/api-keys/123-345/revoke',
          },
        ],
        createKeyLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.apiKeys.create.index,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
        ),
        revokedKeysLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.apiKeys.revoke.revokedKeys,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
        ),
        showRevokedKeysLink: false,
      })
    })
  })
})
