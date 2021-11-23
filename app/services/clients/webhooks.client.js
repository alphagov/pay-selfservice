'use strict'

const baseClient = require('./base-client/base.client')
const urlJoin = require('url-join')

const defaultRequestOptions = {
  baseUrl: process.env.WEBHOOKS_URL,
  json: true,
  service: 'webhooks'
}

function webhook (id, serviceId, options = {}) {
  const url = urlJoin('/v1/webhook', id)
  const request = {
    url,
    qs: {
      service_id: serviceId
    },
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
    ...defaultRequestOptions,
    ...options,
    description: 'Create a Webhook'
  }
  return baseClient.post(request)
}

function updateWebhook (id, serviceId, options = {}) {
  const url = urlJoin('/v1/webhook', id)
  const body = [
    { op: 'replace', path: 'callback_url', value: options.callback_url },
    { op: 'replace', path: 'subscriptions', value: options.subscriptions },
    { op: 'replace', path: 'description', value: options.description }
  ]
  const request = {
    url,
    qs: {
      service_id: serviceId
    },
    body,
    ...defaultRequestOptions,
    ...options,
    description: 'Update a Webhook'
  }
  return baseClient.patch(request)
}

module.exports = {
  webhook,
  webhooks,
  createWebhook,
  updateWebhook
}
