const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { NotFoundError } = require('@root/errors')

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = '1337'

const mockResponse = sinon.spy()
const mockApiKeysService = {
  getRevokedKeys: sinon.stub().resolves([])
}

const {
  req,
  res,
  next,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/api-keys/revoke/revoked-keys.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    id: GATEWAY_ACCOUNT_ID
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/api-keys.service': mockApiKeysService
  })
  .build()

describe('Controller: settings/api-keys/revoked-keys', () => {
  describe('get', () => {
    describe('when revoked keys are present', () => {
      const revokedKeys = [
        {
          description: 'my token',
          createdBy: 'system generated',
          issuedDate: '12 Dec 2024',
          tokenLink: '123-345',
          revokedDate: '14 Jan 2025'
        }
      ]

      before(() => {
        mockApiKeysService.getRevokedKeys.resolves(revokedKeys)
        call('get')
      })

      it('should call getRevokedKeys with args', () => {
        sinon.assert.calledOnceWithExactly(mockApiKeysService.getRevokedKeys,
          GATEWAY_ACCOUNT_ID
        )
      })

      it('should call the response method with context', () => {
        sinon.assert.calledOnceWithExactly(mockResponse,
          req,
          res,
          'simplified-account/settings/api-keys/revoke/revoked-keys',
          {
            tokens: revokedKeys,
            backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
          }
        )
      })
    })
    describe('when revoked keys are not present', () => {
      before(() => {
        mockApiKeysService.getRevokedKeys.resolves([])
        call('get')
      })

      it('should call getRevokedKeys with args', () => {
        sinon.assert.calledOnceWithExactly(mockApiKeysService.getRevokedKeys,
          GATEWAY_ACCOUNT_ID
        )
      })

      it('should not call the response method ', () => {
        sinon.assert.notCalled(mockResponse)
      })

      it('should call next with error', () => {
        sinon.assert.calledOnceWithMatch(next,
          sinon.match.instanceOf(NotFoundError)
            .and(sinon.match.has('message', `No revoked keys found for gateway account [gateway_account_id: ${GATEWAY_ACCOUNT_ID}]`))
        )
      })
    })
  })
})
