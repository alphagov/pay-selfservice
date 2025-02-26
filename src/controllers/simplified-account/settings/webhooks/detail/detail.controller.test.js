const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const sinon = require('sinon')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'
const GATEWAY_ACCOUNT_ID = '123'
const WEBHOOK_ID = 'my-webhook-id-789'

const webhook = {
  id: WEBHOOK_ID,
  callback_url: 'https://www.callback-url.gov.uk',
  description: 'This is a description of the webhook',
  status: 'ACTIVE'
}
const signingSecret = { signing_key: '123-signing-key-456'}
const webhookMessages = {
  count: 10,
  page: 1,
  total: 11,
  results: [
    { resource_id: 'payment_id-1' },
    { resource_id: 'payment_id-2' },
    { resource_id: 'payment_id-3' },
    { resource_id: 'payment_id-4' },
    { resource_id: 'payment_id-5' },
    { resource_id: 'payment_id-6' },
    { resource_id: 'payment_id-7' },
    { resource_id: 'payment_id-8' },
    { resource_id: 'payment_id-9' },
    { resource_id: 'payment_id-10' },
    { resource_id: 'payment_id-11' }
  ]
}

const mockResponse = sinon.spy()
const mockGetWebhook = sinon.stub().resolves(webhook)
const mockGetSigningSecret = sinon.stub().resolves(signingSecret)
const mockGetWebhookMessages = sinon.stub().resolves(webhookMessages)

const { res, nextRequest, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/webhooks/detail/detail.controller')
  .withServiceExternalId(SERVICE_ID)
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
    before(() => {
      nextRequest({
        params: { webhookId: WEBHOOK_ID }
      })
      call('get')
    })

    it('should call the response method', () => {
      expect(mockGetWebhook.calledWith(WEBHOOK_ID, SERVICE_ID, GATEWAY_ACCOUNT_ID)).to.be.true // eslint-disable-line
      expect(mockGetWebhookMessages.calledWith(WEBHOOK_ID)).to.be.true // eslint-disable-line
      expect(mockGetSigningSecret.calledWith(WEBHOOK_ID, SERVICE_ID, GATEWAY_ACCOUNT_ID)).to.be.true // eslint-disable-line
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0].params).to.deep.equal({ webhookId: WEBHOOK_ID })
      expect(mockResponse.args[0]).to.include(res)
      expect(mockResponse.args[0]).to.include('simplified-account/settings/webhooks/detail')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('webhook').to.deep.equal(webhook)
      expect(mockResponse.args[0][3]).to.have.property('signingSecret').to.deep.equal(signingSecret)
      expect(mockResponse.args[0][3]).to.have.property('deliveryStatus').to.equal('all')
      expect(mockResponse.args[0][3]).to.have.property('webhookEvents').to.have.length(11)
      expect(mockResponse.args[0][3].webhookEvents[0]).to.have.property('resourceId').to.equal('payment_id-1')
      expect(mockResponse.args[0][3]).to.have.property('paginationDetails').to.deep.equal({
        items: [
          {
            number: 1,
            href: '/simplified/service/service-id-123abc/account/test/settings/webhooks/my-webhook-id-789?deliveryStatus=all&page=1',
            current: true
          },
          {
            number: 2,
            href: '/simplified/service/service-id-123abc/account/test/settings/webhooks/my-webhook-id-789?deliveryStatus=all&page=2'
          }
        ],
        next: {
          href: '/simplified/service/service-id-123abc/account/test/settings/webhooks/my-webhook-id-789?deliveryStatus=all&page=2'
        }
      })
      expect(mockResponse.args[0][3]).to.have.property('eventTypes').to.have.property('CARD_PAYMENT_SUCCEEDED').to.equal('Payment succeeded')
      expect(mockResponse.args[0][3]).to.have.property('backToWebhooksLink')
        .to.equal('/simplified/service/service-id-123abc/account/test/settings/webhooks')
    })
  })
})
