'use strict'

const baseClient = require('./base-client/base.client')
const urlJoin = require('url-join')

const defaultRequestOptions = {
  baseUrl: process.env.WEBHOOKS_URL,
  json: true,
  service: 'webhooks'
}

function webhook (id, options = {}) {
  const url = urlJoin('/v1/webhook', id)
  const request = {
    url,
    description: 'Get one webhook',
    ...defaultRequestOptions,
    ...options
  }
  return baseClient.get(request)
}

function webhooks (serviceId, isLive, options = {}) {
  const url = '/v1/webhook'
  const request = {
    url,
    qs: {
      service_id: serviceId,
      live: isLive
    },
    description: 'List webhooks for service',
    ...defaultRequestOptions,
    ...options
  }
  return baseClient.get(request)
}

function createWebhook (serviceId, isLive, options = {}) {
  const url = '/v1/webhook'
  const request = {
    url,
    body: {
      service_id: serviceId,
      live: isLive,
      callback_url: options.callback_url,
      subscriptions: options.subscriptions,
      description: options.description
    },
    description: 'Create a webhook',
    ...defaultRequestOptions,
    ...options
  }
  return baseClient.post(request)
}

module.exports = {
  webhook,
  webhooks,
  createWebhook
}
