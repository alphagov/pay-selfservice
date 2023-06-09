'use strict'

const baseClient = require('./base-client/base.client')
const urlJoin = require('url-join')

const defaultRequestOptions = {
  baseUrl: process.env.WEBHOOKS_URL,
  json: true,
  service: 'webhooks'
}

function webhook (id, serviceId, gatewayAccountId, options = {}) {
  const url = urlJoin('/v1/webhook', id)
  const request = {
    url,
    qs: {
      service_id: serviceId,
      gateway_account_id: gatewayAccountId
    },
    description: 'Get one webhook',
    ...defaultRequestOptions,
    ...options
  }
  return baseClient.get(request)
}

function signingSecret (webhookId, serviceId, gatewayAccountId, options = {}) {
  const url = urlJoin('/v1/webhook/', webhookId, '/signing-key')
  const request = {
    url,
    qs: {
      service_id: serviceId,
      gateway_account_id: gatewayAccountId
    },
    description: 'Get a Webhook signing secret',
    ...defaultRequestOptions,
    ...options
  }
  return baseClient.get(request)
}

function resetSigningSecret (webhookId, serviceId, gatewayAccountId, options = {}) {
  const url = urlJoin('/v1/webhook/', webhookId, '/signing-key')
  const request = {
    url,
    qs: {
      service_id: serviceId,
      gateway_account_id: gatewayAccountId
    },
    description: 'Reset a Webhook signing secret',
    ...defaultRequestOptions,
    ...options
  }
  return baseClient.post(request)
}

function webhooks (serviceId, gatewayAccountId, isLive, options = {}) {
  const url = '/v1/webhook'
  const request = {
    url,
    qs: {
      service_id: serviceId,
      gateway_account_id: gatewayAccountId,
      live: isLive
    },
    description: 'List webhooks for service',
    ...defaultRequestOptions,
    ...options
  }
  return baseClient.get(request)
}

function message (id, webhookId, options = {}) {
  const url = urlJoin('/v1/webhook', webhookId, 'message', id)
  const request = {
    url,
    description: 'Get webhook message',
    ...defaultRequestOptions,
    ...options
  }
  return baseClient.get(request)
}

function attempts (messageId, webhookId, options = {}) {
  const url = urlJoin('/v1/webhook', webhookId, 'message', messageId, 'attempt')
  const request = {
    url,
    description: 'Get webhook message delivery attempts',
    ...defaultRequestOptions,
    ...options
  }
  return baseClient.get(request)
}

function messages (id, options = {}) {
  const url = urlJoin('/v1/webhook', id, 'message')
  const request = {
    url,
    qs: {
      page: options.page,
      ...options.status && { status: options.status.toUpperCase() }
    },
    description: 'List messages for webhook',
    ...defaultRequestOptions,
    ...options
  }
  return baseClient.get(request)
}

function createWebhook (serviceId, gatewayAccountId, isLive, options = {}) {
  const url = '/v1/webhook'
  const request = {
    url,
    body: {
      service_id: serviceId,
      gateway_account_id: gatewayAccountId,
      live: isLive,
      callback_url: options.callback_url,
      subscriptions: options.subscriptions,
      description: options.description
    },
    ...defaultRequestOptions,
    ...options,
    description: 'Create a Webhook'
  }
  return baseClient.post(request)
}

function updateWebhook (id, serviceId, gatewayAccountId, options = {}) {
  const url = urlJoin('/v1/webhook', id)
  const paths = ['callback_url', 'subscriptions', 'description', 'status']
  const body = []
  paths.forEach((path) => {
    if (options[path]) {
      body.push({ op: 'replace', path, value: options[path] })
    }
  })
  const request = {
    url,
    qs: {
      service_id: serviceId,
      gateway_account_id: gatewayAccountId
    },
    body,
    ...defaultRequestOptions,
    ...options,
    description: 'Update a Webhook'
  }
  return baseClient.patch(request)
}

function resendWebhookMessage (webhookId, messageId, options = {}) {
  const url = urlJoin('/v1/webhook', webhookId, 'message', messageId, 'resend')
  const request = {
    url,
    ...defaultRequestOptions,
    ...options,
    description: 'Schedule resending a message'
  }
  return baseClient.post(request)
}

module.exports = {
  webhook,
  webhooks,
  createWebhook,
  updateWebhook,
  signingSecret,
  resetSigningSecret,
  messages,
  message,
  attempts,
  resendWebhookMessage
}
