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
  const hasMultiplePages = count >= PAGE_SIZE
  const links = hasMultiplePages && paginator.buildNavigation(count)
  return {
    ...searchResponse,
    links
  }
}

async function listWebhooks (serviceId, isLive) {
  const webhooks = await webhooksClient.webhooks(serviceId, isLive)
  return webhooks.sort(sortByActiveStatus)
}

function createWebhook (serviceId, isLive, options = {}) {
  options.subscriptions = typeof options.subscriptions === 'string' ? [ options.subscriptions ] : options.subscriptions
  return webhooksClient.createWebhook(serviceId, isLive, options)
}

function updateWebhook (id, serviceId, options = {}) {
  options.subscriptions = typeof options.subscriptions === 'string' ? [ options.subscriptions ] : options.subscriptions
  return webhooksClient.updateWebhook(id, serviceId, options)
}

function getWebhook (id, serviceId) {
  return webhooksClient.webhook(id, serviceId)
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

function getSigningSecret (webhookId, serviceId) {
  return webhooksClient.signingSecret(webhookId, serviceId)
}

function resetSigningSecret (webhookId, serviceId) {
  return webhooksClient.resetSigningSecret(webhookId, serviceId)
}

function toggleStatus (webhookId, serviceId, currentStatus) {
  const status = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  return webhooksClient.updateWebhook(webhookId, serviceId, { status })
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
