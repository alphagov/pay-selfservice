'use strict'

const baseClient = require('./base-client/base.client')
const urlJoin = require('url-join')

const defaultRequestOptions = {
  baseUrl: process.env.LEDGER_URL,
  json: true,
  service: 'webhooks',
}

function webhook(id) {
  const url = urlJoin('/v1/webhooks', id)
  const request = {
    url,
    description: 'Get one webhook',
    ...defaultRequestOptions
  }
  return baseClient.get(request)
}

function webhooks(serviceId, isLive) {
  const url = '/v1/webhooks'
  const request = {
    url,
    qs: {
      service_id: serviceId,
      live: isLive
    },
    description: 'List webhooks for service',
    ...defaultRequestOptions
  }
  return baseClient.get(request)
}

function createWebhook(serviceId, isLive, options = {}) {
  const url = urlJoin('/v1/webhooks', id)
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
    ...defaultRequestOptions
  }
  return baseClient.post(request)
}

module.exports = {
  webhook,
  webhooks,
  createWebhook
}