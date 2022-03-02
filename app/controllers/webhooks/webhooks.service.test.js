const { expect } = require('chai')
const sinon = require('sinon')

const proxyquire = require('proxyquire')

const webhooksFixture = require('./../../../test/fixtures/webhooks.fixtures')

describe('webhooks service', () => {
  describe('list webhooks', () => {
    it('should order webhooks with active webhooks first', async () => {
      const webhooks = webhooksFixture.webhooksListResponse([
        { external_id: 1, status: 'INACTIVE' },
        { external_id: 2, status: 'ACTIVE' },
        { external_id: 3, status: 'INACTIVE' },
        { external_id: 4, status: 'INACTIVE' },
        { external_id: 5, status: 'ACTIVE' }
      ])
      const service = getWebhooksService(webhooks)
      const result = await service.listWebhooks('some-service-id', true)
      expect(result.map(webhook => webhook.external_id)).to.deep.equal([2, 5, 1, 3, 4])
    })
  })
  describe('create webhooks', () => {
    it('should normalise subscriptions from the frontend, uniformly submitting them as a list', () => {
      const spy = sinon.spy(async () => {})
      const service = getWebhooksServiceWithStub({ createWebhook: spy })
      service.createWebhook('some-service-id', true, { subscriptions: 'my-subscription' })
      sinon.assert.calledWith(spy, 'some-service-id', true, { subscriptions: ['my-subscription'] })
    })
    it('should not change a list of valid subscriptions', () => {
      const spy = sinon.spy(async () => {})
      const service = getWebhooksServiceWithStub({ createWebhook: spy })
      service.createWebhook('some-service-id', true, { subscriptions: ['my-first-subscription', 'my-second-subscription'] })
      sinon.assert.calledWith(spy, 'some-service-id', true, { subscriptions: ['my-first-subscription', 'my-second-subscription'] })
    })
  })
  describe('Toggle webhook status', () => {
    it('should deactivate given an active webhook', () => {
      const spy = sinon.spy(async () => {})
      const service = getWebhooksServiceWithStub({ updateWebhook: spy })
      service.toggleStatus('webhook-id', 'service-id', 'ACTIVE')
      sinon.assert.calledWith(spy, 'webhook-id', 'service-id', { status: 'INACTIVE' })
    })
    it('should active given an inactive webhook', () => {
      const spy = sinon.spy(async () => {})
      const service = getWebhooksServiceWithStub({ updateWebhook: spy })
      service.toggleStatus('webhook-id', 'service-id', 'INACTIVE')
      sinon.assert.calledWith(spy, 'webhook-id', 'service-id', { status: 'ACTIVE' })
    })
  })
  describe('List webhook messages', () => {
    it('should get webhook messages with correctly formatted pagination', async () => {
      const search = webhooksFixture.webhookMessageSearchResponse([
        { latest_attempt: { status: 'SUCCESSFUL' } },
        { latest_attempt: { status: 'SUCCESSFUL' } },
        { latest_attempt: { status: 'SUCCESSFUL' } },
        { latest_attempt: { status: 'SUCCESSFUL' } },
        { latest_attempt: { status: 'SUCCESSFUL' } },
        { latest_attempt: { status: 'SUCCESSFUL' } },
        { latest_attempt: { status: 'SUCCESSFUL' } },
        { latest_attempt: { status: 'SUCCESSFUL' } },
        { latest_attempt: { status: 'SUCCESSFUL' } },
        { latest_attempt: { status: 'SUCCESSFUL' } },
        { latest_attempt: { status: 'SUCCESSFUL' } }
      ])
      const spy = sinon.spy(async () => search)
      const service = getWebhooksServiceWithStub({ messages: spy })
      const result = await service.getWebhookMessages('webhook-id', { status: 'failed' })

      sinon.assert.calledWith(spy, 'webhook-id', { status: 'failed' })
      expect(result.total).to.equal(11)

      // 2 pages and a next button for constant service page settings
      expect(result.links.length).to.equal(3)
      expect(result.links[2].pageName).to.equal('next')
    })
  })
})

function getWebhooksServiceWithStub (stub) {
  const webhooksService = proxyquire('./webhooks.service.js', { './../../services/clients/webhooks.client': stub })
  return webhooksService
}

function getWebhooksService (listWebhooksResponseStub = []) {
  return getWebhooksServiceWithStub({ webhooks: async (serviceId, isLive) => listWebhooksResponseStub })
}
