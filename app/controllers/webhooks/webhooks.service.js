'use strict'

const webhooksClient = require('./../../services/clients/webhooks.client')
const Paginator = require('../../utils/paginator')

const PAGE_SIZE = 10
const MAX_PAGES = 3

function sortByActiveStatus (a, b) {
  return Number(b.status === 'ACTIVE') - Number(a.status === 'ACTIVE')
}

function formatPages(searchResponse) {
  const { total, page } = searchResponse
  const paginator = new Paginator(total, PAGE_SIZE, page)
  const hasMultiplePages = paginator.getLast() > 1
  const links = hasMultiplePages && paginator.getNamedCentredRange(MAX_PAGES, true, true)
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

async function getWebhookMessages(id, serviceId, options = {}) {
  const searchResponse =  await webhooksClient.messages(id, serviceId, options)
  return formatPages(searchResponse)
}

function getSigningSecret(webhookId, serviceId) {
  return webhooksClient.signingSecret(webhookId, serviceId)
}

function resetSigningSecret(webhookId, serviceId) {
  return webhooksClient.resetSigningSecret(webhookId, serviceId)
}

function toggleStatus(webhookId, serviceId, currentStatus) {
  const status = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  return webhooksClient.updateWebhook(webhookId, serviceId, { status })
}

module.exports = {
  listWebhooks,
  createWebhook,
  updateWebhook,
  getWebhook,
  getSigningSecret,
  resetSigningSecret,
  toggleStatus,
  getWebhookMessages
}
