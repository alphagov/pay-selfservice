const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const ACCOUNT_TYPE = 'live'
const ACCOUNT_ID = '1337'
const SERVICE_EXTERNAL_ID = 'service123abc'

const mockResponse = sinon.stub()
const apiKeys = [{
  description: 'my token',
  createdBy: 'system generated',
  issuedDate: '12 Dec 2024',
  tokenLink: '123-345'
}]
const mockApiKeysService = {
  getActiveKeys: sinon.stub().resolves(apiKeys),
  getRevokedKeys: sinon.stub().resolves([])
}

const {
  req,
  res,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/api-keys/api-keys.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    id: ACCOUNT_ID
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/api-keys.service': mockApiKeysService
  })
  .build()

describe('Controller: settings/api-keys', () => {
  describe('get', () => {
    beforeEach(async () => {
      await call('get')
    })

    it('should call apiKeysService', () => {
      sinon.assert.calledOnceWithExactly(mockApiKeysService.getActiveKeys,
        ACCOUNT_ID
      )
      sinon.assert.calledOnceWithExactly(mockApiKeysService.getRevokedKeys,
        ACCOUNT_ID
      )
    })

    it('should call the response method with context', () => {
      sinon.assert.calledOnceWithExactly(mockResponse,
        req,
        res,
        'simplified-account/settings/api-keys/index',
        {
          messages: [],
          accountType: ACCOUNT_TYPE,
          activeKeys: [
            {
              description: 'my token',
              createdBy: 'system generated',
              issuedDate: '12 Dec 2024',
              tokenLink: '123-345',
              changeNameLink: '/service/service123abc/account/live/settings/api-keys/123-345/change-name',
              revokeKeyLink: '/service/service123abc/account/live/settings/api-keys/123-345/revoke'
            }
          ],
          createKeyLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.create.index,
            SERVICE_EXTERNAL_ID, ACCOUNT_TYPE),
          revokedKeysLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.revoke.revokedKeys,
            SERVICE_EXTERNAL_ID, ACCOUNT_TYPE),
          showRevokedKeysLink: false
        }
      )
    })
  })
})
