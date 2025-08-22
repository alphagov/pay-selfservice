const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const sinon = require('sinon')
const { Webhook, WebhookStatus } = require('@models/webhooks/Webhook.class')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service123abc'

const GATEWAY_ACCOUNT_ID = '123'

const webhook = new Webhook()
  .withCallbackUrl('https://www.callback-url.gov.uk')
  .withDescription('This is a description of the webhook')
  .withStatus(WebhookStatus.ACTIVE)

const mockResponse = sinon.stub()
const mockListWebhooks = sinon.stub().resolves([webhook])

const { req, res, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/webhooks/webhooks.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
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
    beforeEach(async () => {
      await call('get')
    })

    it('should call the response method', () => {
      expect(mockListWebhooks.calledWith(SERVICE_EXTERNAL_ID, GATEWAY_ACCOUNT_ID, false)).to.be.true
      expect(mockResponse.called).to.be.true
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0]).to.include(req)
      expect(mockResponse.args[0]).to.include(res)
      expect(mockResponse.args[0]).to.include('simplified-account/settings/webhooks/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('activeWebhooks').to.have.length(1)
      expect(mockResponse.args[0][3]).to.have.property('deactivatedWebhooks').to.have.length(0)
      expect(mockResponse.args[0][3].activeWebhooks[0]).to.have.property('callbackUrl').to.equal('https://www.callback-url.gov.uk')
      expect(mockResponse.args[0][3]).to.have.property('eventTypes').to.have.property('CARD_PAYMENT_SUCCEEDED').to.equal('Payment succeeded')
      expect(mockResponse.args[0][3]).to.have.property('createWebhookLink')
        .to.equal('/service/service123abc/account/test/settings/webhooks/create')
    })
  })
})
