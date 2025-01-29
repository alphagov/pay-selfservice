const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const sinon = require('sinon')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

const mockResponse = sinon.spy()

const { req, res, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/webhooks/create/create.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse }
  })
  .build()

describe('Controller: settings/webhooks', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0]).to.include(req)
      expect(mockResponse.args[0]).to.include(res)
      expect(mockResponse.args[0]).to.include('simplified-account/settings/webhooks/create')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('eventTypes').to.have.property('CARD_PAYMENT_SUCCEEDED').to.equal('Payment succeeded')
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal('/simplified/service/service-id-123abc/account/test/settings/webhooks')
    })
  })
})
