const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { expect } = require('chai')
const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'

const mockResponse = sinon.spy()
const apiKeys = [{ description: 'my token', createdBy: 'system generated', issuedDate: '12 Dec 2024', tokenLink: '123-345' }]
const apiKeysService = {
  getActiveKeys: sinon.stub().resolves(apiKeys)
}

const {
  req,
  res,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/api-keys/api-keys.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/api-keys.service': apiKeysService
  })
  .build()

describe('Controller: settings/api-keys', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse).to.have.been.calledOnce // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse).to.have.been.calledWith(req, res, 'simplified-account/settings/api-keys/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('accountType').to.equal('live')
      expect(mockResponse.args[0][3]).to.have.property('activeKeys').to.deep.equal(
        apiKeys.map(apiKey => {
          return {
            ...apiKey,
            changeNameLink: `/simplified/service/${SERVICE_ID}/account/${ACCOUNT_TYPE}/settings/api-keys/change-name/${apiKeys[0].tokenLink}`,
            revokeKeyLink: `/simplified/service/${SERVICE_ID}/account/${ACCOUNT_TYPE}/settings/api-keys/revoke/${apiKeys[0].tokenLink}`
          }
        }))
    })
  })
})
