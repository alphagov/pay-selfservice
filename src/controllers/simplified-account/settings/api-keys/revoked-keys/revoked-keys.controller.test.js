const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('../../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const GatewayAccount = require('@models/GatewayAccount.class')

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'
const GATEWAY_ACCOUNT_ID = '1'
const mockResponse = sinon.spy()
const revokedKeys = [
  {
    description: 'my token',
    createdBy: 'system generated',
    issuedDate: '12 Dec 2024',
    tokenLink: '123-345',
    revokedDate: '14 Jan 2025'
  }]
const apiKeysService = {
  getRevokedKeys: sinon.stub().resolves(revokedKeys)
}

const {
  req,
  res,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/api-keys/revoked-keys/revoked-keys.controller')
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

describe('Controller: settings/api-keys/revoked-keys', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })
    it('should call apiKeysService.getRevokedKeys', () => {
      expect(apiKeysService.getRevokedKeys).to.have.been.calledWith(GATEWAY_ACCOUNT_ID)
    })

    it('should call the response method', () => {
      expect(mockResponse).to.have.been.calledOnce // eslint-disable-line
    })

    it('should pass req, res, template path and context to the response method', () => {
      expect(mockResponse).to.have.been.calledWith(
        req,
        res,
        'simplified-account/settings/api-keys/revoked-keys',
        {
          tokens: revokedKeys,
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, SERVICE_ID, ACCOUNT_TYPE)
        })
    })
  })
})
