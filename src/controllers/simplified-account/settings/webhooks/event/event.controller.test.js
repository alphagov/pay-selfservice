const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const sinon = require('sinon')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-external-id-123abc'
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'gateway-external-id-123'
const WEBHOOK_EXTERNAL_ID = 'webhook-external-id-789'
const WEBHOOK_EVENT_EXTERNAL_ID = 'event-external-id-1'
const CHARGE_ID = 'charge-id-123'
const BACK_URL = `/service/${SERVICE_EXTERNAL_ID}/account/test/settings/webhooks/${WEBHOOK_EXTERNAL_ID}`
const RESOURCE_URL = `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/transactions/${CHARGE_ID}`

const event = {
  external_id: WEBHOOK_EVENT_EXTERNAL_ID,
  resource_id: CHARGE_ID
}
const attempts = [
  {
    created_date: '2025-02-26T12:36:54.050Z',
    send_at: '2025-02-28T12:36:54.050Z',
    status: 'FAILED',
    response_time: 447,
    status_code: 403,
    result: '403 Forbidden'
  },
  {
    created_date: '2025-02-25T12:36:52.819Z',
    send_at: '2025-02-26T12:36:52.819Z',
    status: 'FAILED',
    response_time: 473,
    status_code: 403,
    result: '403 Forbidden'
  }
]
const mockResponse = sinon.spy()
const mockGetWebhookMessage = sinon.stub().resolves(event)
const mockGetWebhookMessageAttempts = sinon.stub().resolves(attempts)

const { res, nextRequest, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/webhooks/event/event.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withAccount({ type: ACCOUNT_TYPE, id: GATEWAY_ACCOUNT_EXTERNAL_ID })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/webhooks.service':
      { getWebhookMessage: mockGetWebhookMessage, getWebhookMessageAttempts: mockGetWebhookMessageAttempts }
  })
  .build()

describe('Controller: settings/webhooks/event', () => {
  describe('get', () => {
    before(() => {
      nextRequest({
        params: { webhookExternalId: WEBHOOK_EXTERNAL_ID, eventId: WEBHOOK_EVENT_EXTERNAL_ID },
        account: {
          externalId: GATEWAY_ACCOUNT_EXTERNAL_ID
        }
      })
      call('get')
    })

    it('should call the response method', () => {
      expect(mockGetWebhookMessage.calledWith(WEBHOOK_EVENT_EXTERNAL_ID, WEBHOOK_EXTERNAL_ID)).to.be.true // eslint-disable-line
      expect(mockGetWebhookMessageAttempts.calledWith(WEBHOOK_EVENT_EXTERNAL_ID, WEBHOOK_EXTERNAL_ID)).to.be.true // eslint-disable-line
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0].params).to.deep.equal({ webhookExternalId: WEBHOOK_EXTERNAL_ID, eventId: WEBHOOK_EVENT_EXTERNAL_ID })
      expect(mockResponse.args[0]).to.include(res)
      expect(mockResponse.args[0]).to.include('simplified-account/settings/webhooks/event')
    })

    it('should pass context data to the response method', () => {
      const context = mockResponse.args[0][3]
      expect(context).to.have.property('backLink').to.equal(BACK_URL)
      expect(context).to.have.property('resourceLink').to.equal(RESOURCE_URL)
      expect(context).to.have.property('event').to.deep.equal(event)
      expect(context).to.have.property('attempts').to.deep.equal(attempts)
    })
  })
})
