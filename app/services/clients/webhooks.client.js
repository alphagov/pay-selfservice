'use strict'

const { Client } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/axios-base-client')
const { configureClient } = require('./base/config')
const urlJoin = require('url-join')

const defaultRequestOptions = {
  baseUrl: process.env.WEBHOOKS_URL,
  json: true,
  service: 'webhooks'
}

const client = new Client(defaultRequestOptions.service)

async function webhook (id, serviceId, gatewayAccountId, options = {}) {
  const baseUrl = options.baseUrl ? options.baseUrl : defaultRequestOptions.baseUrl
  const url = urlJoin(baseUrl, '/v1/webhook', id)
  const fullUrl = `${url}?service_id=${serviceId}&gateway_account_id=${gatewayAccountId}`
  configureClient(client, fullUrl)
  const response = await client.get(fullUrl, 'Get one webhook')
  return response.data
}

async function signingSecret (webhookId, serviceId, gatewayAccountId, options = {}) {
  const baseUrl = options.baseUrl ? options.baseUrl : defaultRequestOptions.baseUrl
  const url = urlJoin(baseUrl, '/v1/webhook/', webhookId, '/signing-key')
  const fullUrl = `${url}?service_id=${serviceId}&gateway_account_id=${gatewayAccountId}`
  configureClient(client, fullUrl)
  const response = await client.get(fullUrl, 'Get a Webhook signing secret')
  return response.data
}

async function resetSigningSecret (webhookId, serviceId, gatewayAccountId, options = {}) {
  const baseUrl = options.baseUrl ? options.baseUrl : defaultRequestOptions.baseUrl
  const url = urlJoin(baseUrl, '/v1/webhook/', webhookId, '/signing-key')
  const fullUrl = `${url}?service_id=${serviceId}&gateway_account_id=${gatewayAccountId}`
  configureClient(client, fullUrl)
  const response = await client.post(fullUrl, 'Reset a Webhook signing secret')
  return response.data
}

async function webhooks (serviceId, gatewayAccountId, isLive, options = {}) {
  const baseUrl = options.baseUrl ? options.baseUrl : defaultRequestOptions.baseUrl
  const url = urlJoin(baseUrl, '/v1/webhook')
  const fullUrl = `${url}?service_id=${serviceId}&gateway_account_id=${gatewayAccountId}&live=${isLive}`
  configureClient(client, fullUrl)
  const response = await client.get(fullUrl, 'List webhooks for service')
  return response.data
}

async function message (id, webhookId, options = {}) {
  const baseUrl = options.baseUrl ? options.baseUrl : defaultRequestOptions.baseUrl
  const url = urlJoin(baseUrl, '/v1/webhook', webhookId, 'message', id)
  configureClient(client, url)
  const response = await client.get(url, 'Get webhook message')
  return response.data
}

async function attempts (messageId, webhookId, options = {}) {
  const baseUrl = options.baseUrl ? options.baseUrl : defaultRequestOptions.baseUrl
  const url = urlJoin(baseUrl, '/v1/webhook', webhookId, 'message', messageId, 'attempt')
  configureClient(client, url)
  const response = await client.get(url, 'Get webhook message delivery attempts')
  return response.data
}

async function messages (id, options = {}) {
  const baseUrl = options.baseUrl ? options.baseUrl : defaultRequestOptions.baseUrl
  const url = urlJoin(baseUrl, '/v1/webhook', id, 'message')
  let fullUrl = `${url}?page=${options.page}`
  if (options.status) {
    fullUrl = `${fullUrl}&status=${options.status.toUpperCase()}`
  }
  configureClient(client, fullUrl)
  const response = await client.get(fullUrl, 'List messages for webhook')
  return response.data
}

async function createWebhook (serviceId, gatewayAccountId, isLive, options = {}) {
  const body = {
    service_id: serviceId,
    gateway_account_id: gatewayAccountId,
    live: isLive,
    callback_url: options.callback_url,
    subscriptions: options.subscriptions,
    description: options.description
  }
  const baseUrl = options.baseUrl ? options.baseUrl : defaultRequestOptions.baseUrl
  const url = urlJoin(baseUrl, '/v1/webhook')
  configureClient(client, url)
  const response = await client.post(url, body, 'Create a Webhook')
  return response.data
}

async function updateWebhook (id, serviceId, gatewayAccountId, options = {}) {
  const paths = [ 'callback_url', 'subscriptions', 'description', 'status' ]
  const body = []
  paths.forEach((path) => {
    if (options[path]) {
      body.push({ op: 'replace', path, value: options[path] })
    }
  })
  const baseUrl = options.baseUrl ? options.baseUrl : defaultRequestOptions.baseUrl
  const url = urlJoin(baseUrl, '/v1/webhook', id)
  const fullUrl = `${url}?service_id=${serviceId}&gateway_account_id=${gatewayAccountId}`
  configureClient(client, fullUrl)
  const response = await client.patch(fullUrl, body, 'Create a Webhook')
  return response.data
}

async function resendWebhookMessage (webhookId, messageId, options = {}) {
  const baseUrl = options.baseUrl ? options.baseUrl : defaultRequestOptions.baseUrl
  const url = urlJoin(baseUrl, '/v1/webhook', webhookId, 'message', messageId, 'resend')
  configureClient(client, url)
  const response = await client.post(url, {}, 'Schedule resending a message')
  return response.data
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
