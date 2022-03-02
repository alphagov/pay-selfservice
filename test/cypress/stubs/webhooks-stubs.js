'use strict'

const webhooksFixtures = require('../../fixtures/webhooks.fixtures')
const { stubBuilder } = require('./stub-builder')

function getWebhooksListSuccess (opts) {
  const path = '/v1/webhook'
  return stubBuilder('GET', path, 200, {
    query: {
      service_id: opts.service_id,
      live: opts.live
    },
    response: webhooksFixtures.webhooksListResponse(opts.webhooks || [])
  })
}

function getWebhookMessagesListSuccess (opts = {}) {
  const webhook = webhooksFixtures.webhookResponse(opts)
  const path = `/v1/webhook/${webhook.external_id}/message`
  return stubBuilder('GET', path, 200, {
    query: {
      page: opts.page || 1,
      ...opts.status && { status: opts.status }
    },
    response: webhooksFixtures.webhookMessageSearchResponse(opts.messages || [])
  })
}

function getWebhookSuccess (opts = {}) {
  const webhook = webhooksFixtures.webhookResponse(opts)
  const path = `/v1/webhook/${webhook.external_id}`
  return stubBuilder('GET', path, 200, {
    query: {
      service_id: webhook.service_id
    },
    response: webhook
  })
}

function getWebhookSigningSecret (opts = {}) {
  const path = `/v1/webhook/${opts.external_id}/signing-key`
  return stubBuilder('GET', path, 200, {
    query: {
      service_id: opts.service_id
    },
    response: webhooksFixtures.webhookSigningSecretResponse(opts)
  })
}

function getWebhookMessage (opts = {}) {
  const path = `/v1/webhook/${opts.webhook_id}/message/${opts.external_id}`
  return stubBuilder('GET', path, 200, {
    response: webhooksFixtures.webhookMessageResponse(opts)
  })
}

function getWebhookMessageAttempts (opts = {}) {
  const path = `/v1/webhook/${opts.webhook_id}/message/${opts.message_id}/attempt`
  return stubBuilder('GET', path, 200, {
    response: webhooksFixtures.webhooksMessageAttemptsListResponse(opts.attempts || [])
  })
}

module.exports = {
  getWebhooksListSuccess,
  getWebhookSuccess,
  getWebhookSigningSecret,
  getWebhookMessagesListSuccess,
  getWebhookMessage,
  getWebhookMessageAttempts
}
