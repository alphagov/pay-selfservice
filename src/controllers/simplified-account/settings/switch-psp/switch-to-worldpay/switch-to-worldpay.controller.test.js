const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')

const mockResponse = sinon.spy()
const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'

const {
  req,
  res,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/switch-psp/switch-to-worldpay/switch-to-worldpay.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse }
  })
  .build()

describe('Controller: settings/switch-psp/switch-to-worldpay', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/switch-psp/switch-to-worldpay/index')
    })
  })
})
