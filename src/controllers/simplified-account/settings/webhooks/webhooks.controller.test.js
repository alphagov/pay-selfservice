const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const sinon = require('sinon')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

const GATEWAY_ACCOUNT_ID = '123'

const webhook = {
  callback_url: 'https://www.callback-url.gov.uk',
  description: 'This is a description of the webhook',
  status: 'ACTIVE'
}

const mockResponse = sinon.spy()
const mockListWebhooks = sinon.stub().resolves([webhook])

const { req, res, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/webhooks/webhooks.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withAccount({ type: ACCOUNT_TYPE, id: GATEWAY_ACCOUNT_ID })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/webhooks.service':
      { listWebhooks: mockListWebhooks }

  })
  .build()

describe('Controller: settings/webhooks', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockListWebhooks.calledWith(SERVICE_ID, GATEWAY_ACCOUNT_ID, false)).to.be.true // eslint-disable-line
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0]).to.include(req)
      expect(mockResponse.args[0]).to.include(res)
      expect(mockResponse.args[0]).to.include('simplified-account/settings/webhooks/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('activeWebhooks').to.have.length(1)
      expect(mockResponse.args[0][3]).to.have.property('deactivatedWebhooks').to.have.length(0)
      expect(mockResponse.args[0][3].activeWebhooks[0]).to.have.property('callback_url').to.equal('https://www.callback-url.gov.uk')
      expect(mockResponse.args[0][3]).to.have.property('eventTypes').to.have.property('CARD_PAYMENT_SUCCEEDED').to.equal('Payment succeeded')
      expect(mockResponse.args[0][3]).to.have.property('createWebhookLink')
        .to.equal('/simplified/service/service-id-123abc/account/test/settings/webhooks/create')
      expect(mockResponse.args[0][3]).to.have.property('detailWebhookBaseUrl')
        .to.equal('/simplified/service/service-id-123abc/account/test/settings/webhooks/')
    })
  })
})
