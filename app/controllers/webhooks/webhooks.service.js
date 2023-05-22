'use strict'

const webhooksClient = require('./../../services/clients/webhooks.client')
const Paginator = require('../../utils/paginator')

const PAGE_SIZE = 10

function sortByActiveStatus (a, b) {
  return Number(b.status === 'ACTIVE') - Number(a.status === 'ACTIVE')
}

function formatPages (searchResponse) {
  const { page, count } = searchResponse
  const paginator = new Paginator(null, PAGE_SIZE, page)
  const hasMultiplePages = (count >= PAGE_SIZE) || (page > 1)
  const links = hasMultiplePages && paginator.buildNavigation(count)
  return {
    ...searchResponse,
    links
  }
}

async function listWebhooks (serviceId, gatewayAccountId, isLive) {
  const webhooks = await webhooksClient.webhooks(serviceId, gatewayAccountId, isLive)
  return webhooks.sort(sortByActiveStatus)
}

function createWebhook (serviceId, gatewayAccountId, isLive, options = {}) {
  options.subscriptions = typeof options.subscriptions === 'string' ? [ options.subscriptions ] : options.subscriptions
  return webhooksClient.createWebhook(serviceId, gatewayAccountId, isLive, options)
}

function updateWebhook (id, serviceId, gatewayAccountId, options = {}) {
  options.subscriptions = typeof options.subscriptions === 'string' ? [ options.subscriptions ] : options.subscriptions
  return webhooksClient.updateWebhook(id, serviceId, gatewayAccountId, options)
}

function getWebhook (id, serviceId, gatewayAccountId) {
  return webhooksClient.webhook(id, serviceId, gatewayAccountId)
}

function getWebhookMessage (id, webhookId) {
  return webhooksClient.message(id, webhookId)
}

function getWebhookMessageAttempts (messageId, webhookId) {
  return webhooksClient.attempts(messageId, webhookId)
}

async function getWebhookMessages (id, options = {}) {
  const searchResponse = await webhooksClient.messages(id, options)
  return formatPages(searchResponse)
}

function getSigningSecret (webhookId, serviceId, gatewayAccountId) {
  return webhooksClient.signingSecret(webhookId, serviceId, gatewayAccountId)
}

function resetSigningSecret (webhookId, serviceId, gatewayAccountId) {
  return webhooksClient.resetSigningSecret(webhookId, serviceId, gatewayAccountId)
}

function toggleStatus (webhookId, serviceId, gatewayAccountId, currentStatus) {
  const status = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  return webhooksClient.updateWebhook(webhookId, serviceId, gatewayAccountId, { status })
}

function resendWebhookMessage (webhookId, messageId) {
  return webhooksClient.resendWebhookMessage(webhookId, messageId)
}

module.exports = {
  listWebhooks,
  createWebhook,
  updateWebhook,
  getWebhook,
  getSigningSecret,
  resetSigningSecret,
  toggleStatus,
  getWebhookMessages,
  getWebhookMessage,
  getWebhookMessageAttempts,
  resendWebhookMessage
}
