'use strict'

const webhooksClient = require('./clients/webhooks.client')
const Paginator = require('@utils/paginator')
const WebhookUpdateRequest = require('@models/webhooks/WebhookUpdateRequest.class')

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

/**
 *
 * @param serviceExternalId {string}
 * @param gatewayAccountId {string}
 * @param isLive {boolean}
 * @returns {Promise<Webhook[]>}
 */
async function listWebhooks (serviceExternalId, gatewayAccountId, isLive) {
  const webhooks = await webhooksClient.webhooks(serviceExternalId, gatewayAccountId, isLive)
  return webhooks.sort(sortByActiveStatus)
}

function createWebhook (serviceId, gatewayAccountId, isLive, options = {}) {
  options.subscriptions = typeof options.subscriptions === 'string' ? [options.subscriptions] : options.subscriptions
  return webhooksClient.createWebhook(serviceId, gatewayAccountId, isLive, options)
}

/**
 *
 * @param webhookExternalId {String}
 * @param serviceExternalId {String}
 * @param gatewayAccountId {String}
 * @param patchRequest {WebhookUpdateRequest}
 * @returns {Promise<*>}
 */
function updateWebhook (webhookExternalId, serviceExternalId, gatewayAccountId, patchRequest) {
  return webhooksClient.updateWebhook(webhookExternalId, serviceExternalId, gatewayAccountId, patchRequest)
}

/**
 *
 * @param webhookExternalId {String}
 * @param serviceExternalId {String}
 * @param gatewayAccountId {String}
 * @returns {Promise<Webhook>}
 */
function getWebhook (webhookExternalId, serviceExternalId, gatewayAccountId) {
  return webhooksClient.webhook(webhookExternalId, serviceExternalId, gatewayAccountId)
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
  const webhookUpdateRequest = new WebhookUpdateRequest()
    .replace().status(status)
  return webhooksClient.updateWebhook(webhookId, serviceId, gatewayAccountId, webhookUpdateRequest)
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
