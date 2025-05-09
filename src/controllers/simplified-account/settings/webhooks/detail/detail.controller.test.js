const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const sinon = require('sinon')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = '123'
const WEBHOOK_EXTERNAL_ID = 'webhook123abc'

const webhook = {
  id: WEBHOOK_EXTERNAL_ID,
  callbackUrl: 'https://www.callback-url.gov.uk',
  description: 'This is a description of the webhook',
  status: 'ACTIVE'
}
const signingSecret = { signing_key: '123-signing-key-456' }
const webhookMessages = {
  count: 10,
  page: 1,
  total: 11,
  results: [
    { resource_id: 'payment1' },
    { resource_id: 'payment2' },
    { resource_id: 'payment3' },
    { resource_id: 'payment4' },
    { resource_id: 'payment5' },
    { resource_id: 'payment6' },
    { resource_id: 'payment7' },
    { resource_id: 'payment8' },
    { resource_id: 'payment9' },
    { resource_id: 'payment10' },
    { resource_id: 'payment11' }
  ]
}
const mockResponse = sinon.spy()
const mockGetWebhook = sinon.stub().resolves(webhook)
const mockGetSigningSecret = sinon.stub().resolves(signingSecret)
const mockGetWebhookMessages = sinon.stub().resolves(webhookMessages)

const {
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/webhooks/detail/detail.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withAccount({ type: ACCOUNT_TYPE, id: GATEWAY_ACCOUNT_ID })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/webhooks.service':
      { getWebhook: mockGetWebhook, getSigningSecret: mockGetSigningSecret, getWebhookMessages: mockGetWebhookMessages }
  })
  .build()

describe('Controller: settings/webhooks/detail', () => {
  describe('get', () => {
    before(async () => {
      nextRequest({
        params: { webhookExternalId: WEBHOOK_EXTERNAL_ID }
      })
      await call('get')
    })

    it('should call the response method', () => {
      expect(mockGetWebhook.calledWith(WEBHOOK_EXTERNAL_ID, SERVICE_EXTERNAL_ID, GATEWAY_ACCOUNT_ID)).to.be.true
      expect(mockGetWebhookMessages.calledWith(WEBHOOK_EXTERNAL_ID)).to.be.true
      expect(mockGetSigningSecret.calledWith(WEBHOOK_EXTERNAL_ID, SERVICE_EXTERNAL_ID, GATEWAY_ACCOUNT_ID)).to.be.true
      expect(mockResponse.called).to.be.true
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0].params).to.deep.equal({ webhookExternalId: WEBHOOK_EXTERNAL_ID })
      expect(mockResponse.args[0]).to.include(res)
      expect(mockResponse.args[0]).to.include('simplified-account/settings/webhooks/detail')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('webhook').to.deep.equal(webhook)
      expect(mockResponse.args[0][3]).to.have.property('signingSecret').to.deep.equal(signingSecret)
      expect(mockResponse.args[0][3]).to.have.property('deliveryStatus').to.equal('all')
      expect(mockResponse.args[0][3]).to.have.property('webhookEvents').to.have.length(11)
      expect(mockResponse.args[0][3].webhookEvents[0]).to.have.property('resourceId').to.equal('payment1')
      expect(mockResponse.args[0][3]).to.have.property('pagination').to.deep.equal({
        classes: 'pagination-links',
        endIndex: 10,
        items: [
          {
            current: true,
            href: '/service/service123abc/account/test/settings/webhooks/webhook123abc?deliveryStatus=all&page=1#events',
            number: 1
          },
          {
            href: '/service/service123abc/account/test/settings/webhooks/webhook123abc?deliveryStatus=all&page=2#events',
            number: 2
          }
        ],
        next: {
          href: '/service/service123abc/account/test/settings/webhooks/webhook123abc?deliveryStatus=all&page=2#events'
        },
        startIndex: 1,
        total: 11
      })
      expect(mockResponse.args[0][3]).to.have.property('eventTypes').to.have.property('CARD_PAYMENT_SUCCEEDED').to.equal('Payment succeeded')
      expect(mockResponse.args[0][3]).to.have.property('backLink')
        .to.equal('/service/service123abc/account/test/settings/webhooks')
    })
  })
})
