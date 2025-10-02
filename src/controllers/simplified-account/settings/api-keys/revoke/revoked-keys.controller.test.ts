import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { NotFoundError } from '@root/errors'

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = '1337'

const mockResponse = sinon.stub()
const mockApiKeysService = {
  getRevokedKeys: sinon.stub().resolves([]),
}

const { req, res, next, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/api-keys/revoke/revoked-keys.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    id: GATEWAY_ACCOUNT_ID,
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/api-keys.service': mockApiKeysService,
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
          revokedDate: '14 Jan 2025',
        },
      ]

      beforeEach(async () => {
        mockApiKeysService.getRevokedKeys.resolves(revokedKeys)
        await call('get')
      })

      it('should call getRevokedKeys with args', () => {
        sinon.assert.calledOnceWithExactly(mockApiKeysService.getRevokedKeys, GATEWAY_ACCOUNT_ID)
      })

      it('should call the response method with context', () => {
        sinon.assert.calledOnceWithExactly(
          mockResponse,
          req,
          res,
          'simplified-account/settings/api-keys/revoke/revoked-keys',
          {
            tokens: revokedKeys,
            backLink: formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.apiKeys.index,
              SERVICE_EXTERNAL_ID,
              ACCOUNT_TYPE
            ),
          }
        )
      })
    })
    describe('when revoked keys are not present', () => {
      beforeEach(async () => {
        mockApiKeysService.getRevokedKeys.resolves([])
        await call('get')
      })

      it('should call getRevokedKeys with args', () => {
        sinon.assert.calledOnceWithExactly(mockApiKeysService.getRevokedKeys, GATEWAY_ACCOUNT_ID)
      })

      it('should not call the response method ', () => {
        sinon.assert.notCalled(mockResponse)
      })

      it('should call next with error', () => {
        sinon.assert.calledOnceWithMatch(
          next,
          sinon.match
            .instanceOf(NotFoundError)
            .and(
              sinon.match.has(
                'message',
                `No revoked keys found for gateway account [gateway_account_id: ${GATEWAY_ACCOUNT_ID}]`
              )
            )
        )
      })
    })
  })
})
