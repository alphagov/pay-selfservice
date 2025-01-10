'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { expect } = require('chai')

const configureSpy = sinon.spy()

class MockClient {
  configure (baseUrl, options) {
    configureSpy(baseUrl, options)
  }

  async get (url, description) {
    const dataResponse = {}
    return Promise.resolve({ data: dataResponse })
  }

  async post (url, description) {
    const dataResponse = {}
    return Promise.resolve({ data: dataResponse })
  }

  async patch (url, description) {
    const dataResponse = {}
    return Promise.resolve({ data: dataResponse })
  }
}

function getWebhooksClient () {
  return proxyquire('./webhooks.client', {
    '@govuk-pay/pay-js-commons/lib/utils/axios-base-client/axios-base-client': { Client: MockClient }
  })
}

describe('Webhook client', () => {
  describe('webhook function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.webhook('id', 'a-service-id', 'a-gateway-account-id', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8008/v1/webhook/id?service_id=a-service-id&gateway_account_id=a-gateway-account-id')
    })

    it('should use configured base url', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.webhook('id', 'a-service-id', 'a-gateway-account-id', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/webhook/id?service_id=a-service-id&gateway_account_id=a-gateway-account-id')
    })
  })

  describe('signingSecret function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.signingSecret('id', 'a-service-id', 'a-gateway-account-id', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8008/v1/webhook/id/signing-key?service_id=a-service-id&gateway_account_id=a-gateway-account-id')
    })

    it('should use configured base url', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.signingSecret('id', 'a-service-id', 'a-gateway-account-id', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/webhook/id/signing-key?service_id=a-service-id&gateway_account_id=a-gateway-account-id')
    })
  })

  describe('webhooks function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.webhooks('a-service-id', 'a-gateway-account-id', 'isLive', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8008/v1/webhook?service_id=a-service-id&gateway_account_id=a-gateway-account-id&live=isLive')
    })

    it('should use configured base url', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.webhooks('a-service-id', 'a-gateway-account-id', 'isLive', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/webhook?service_id=a-service-id&gateway_account_id=a-gateway-account-id&live=isLive')
    })
  })

  describe('message function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.message('id', 'a-webhook-id', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8008/v1/webhook/a-webhook-id/message/id')
    })

    it('should use configured base url', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.message('id', 'a-webhook-id', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/webhook/a-webhook-id/message/id')
    })
  })

  describe('attempts function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.attempts('id', 'a-webhook-id', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8008/v1/webhook/a-webhook-id/message/id/attempt')
    })

    it('should use configured base url', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.attempts('id', 'a-webhook-id', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/webhook/a-webhook-id/message/id/attempt')
    })
  })

  describe('messages function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.messages('id', { page: 1 })

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8008/v1/webhook/id/message?page=1')
    })

    it('should use configured base url', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.messages('id', { baseUrl: 'https://example.com', page: 1 })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/webhook/id/message?page=1')
    })
  })

  describe('createWebhook function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.createWebhook('a-service-id', 'a-gateway-account-id', 'isLive', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8008/v1/webhook')
    })

    it('should use configured base url', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.createWebhook('a-service-id', 'a-gateway-account-id', 'isLive', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/webhook')
    })
  })

  describe('updateWebhook function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.updateWebhook('id', 'a-service-id', 'a-gateway-account-id', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8008/v1/webhook/id?service_id=a-service-id&gateway_account_id=a-gateway-account-id')
    })

    it('should use configured base url', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.updateWebhook('id', 'a-service-id', 'a-gateway-account-id', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/webhook/id?service_id=a-service-id&gateway_account_id=a-gateway-account-id')
    })
  })

  describe('resendWebhookMessage function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.resendWebhookMessage('a-webhook-id', 'a-message-id', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8008/v1/webhook/a-webhook-id/message/a-message-id/resend')
    })

    it('should use configured base url', async () => {
      const webhooksClient = getWebhooksClient()

      await webhooksClient.resendWebhookMessage('a-webhook-id', 'a-message-id', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/webhook/a-webhook-id/message/a-message-id/resend')
    })
  })
})
