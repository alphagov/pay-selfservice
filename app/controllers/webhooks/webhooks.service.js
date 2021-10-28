'use strict'

const webhooksClient = require('./../../services/clients/webhooks.client')

function sortByActiveStatus (a, b) {
  return Number(b.status === 'ACTIVE') - Number(a.status === 'ACTIVE')
}

async function listWebhooks (serviceId, isLive) {
  const webhooks = await webhooksClient.webhooks(serviceId, isLive)
  return webhooks.sort(sortByActiveStatus)
}

function createWebhook (serviceId, isLive, options = {}) {
  options.subscriptions = typeof options.subscriptions === 'string' ? [ options.subscriptions ] : options.subscriptions
  return webhooksClient.createWebhook(serviceId, isLive, options)
}

module.exports = {
  listWebhooks,
  createWebhook
}
