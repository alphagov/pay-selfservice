'use strict'

const webhooksFixtures = require('../../fixtures/webhooks.fixtures')
const { stubBuilder } = require('./stub-builder')

function getWebhooksListSuccess (opts) {
  const path = '/v1/webhook'
  return stubBuilder('GET', path, 200, {
    query: {
      service_id: opts.service_id,
      gateway_account_id: opts.gateway_account_id,
      live: opts.live
    },
    response: webhooksFixtures.webhooksListResponse(opts.webhooks || [])
  })
}

function getWebhookMessagesListSuccess (opts = {}) {
  const webhook = webhooksFixtures.webhookResponse(opts)
  const path = `/v1/webhook/${webhook.external_id}/message`
  return stubBuilder('GET', path, 200, {
    query: {
      page: opts.page || 1,
      ...opts.status && { status: opts.status }
    },
    response: webhooksFixtures.webhookMessageSearchResponse({
      messages: opts.messages || []
    })
  })
}

function getWebhookSuccess (opts = {}) {
  const webhook = webhooksFixtures.webhookResponse(opts)
  const path = `/v1/webhook/${webhook.external_id}`
  return stubBuilder('GET', path, 200, {
    query: {
      service_id: webhook.service_id,
      gateway_account_id: opts.gateway_account_id
    },
    response: webhook
  })
}

function getWebhookSigningSecret (opts = {}) {
  const path = `/v1/webhook/${opts.external_id}/signing-key`
  return stubBuilder('GET', path, 200, {
    query: {
      service_id: opts.service_id,
      gateway_account_id: opts.gateway_account_id
    },
    response: webhooksFixtures.webhookSigningSecretResponse(opts)
  })
}

function getWebhookMessage (opts = {}) {
  const path = `/v1/webhook/${opts.webhook_id}/message/${opts.external_id}`
  return stubBuilder('GET', path, 200, {
    response: webhooksFixtures.webhookMessageResponse(opts)
  })
}

function getWebhookMessageAttempts (opts = {}) {
  const path = `/v1/webhook/${opts.webhook_id}/message/${opts.message_id}/attempt`
  return stubBuilder('GET', path, 200, {
    response: webhooksFixtures.webhooksMessageAttemptsListResponse(opts.attempts || [])
  })
}

function postCreateWebhookSuccess () {
  const path = '/v1/webhook'
  return stubBuilder('POST', path, 200, { deepMatchRequest: false })
}

function createWebhookViolatesBackend (opts = {}) {
  const path = '/v1/webhook'
  return stubBuilder('POST', path, 400, {
    response: {
      error_identifier: 'CALLBACK_URL_NOT_ON_ALLOW_LIST',
      message: 'Callback url violated security constraints'
    },
    deepMatchRequest: false
  })
}

function patchUpdateWebhookViolatesBackend (gatewayAccountId, serviceExternalId, webhookExternalId) {
  const path = `/v1/webhook/${webhookExternalId}`
  return stubBuilder('PATCH', path, 400, {
    query: {
      service_id: serviceExternalId,
      gateway_account_id: gatewayAccountId
    },
    response: {
      error_identifier: 'CALLBACK_URL_NOT_ON_ALLOW_LIST',
      message: 'Callback url violated security constraints'
    },
    deepMatchRequest: false
  })
}

/**
 *
 * @param {Number | String} gatewayAccountId
 * @param {String} serviceExternalId
 * @param {String} webhookExternalId
 * @param {{ path: String, value: String }} patchOpts
 * @returns {{predicates: [{deepEquals: {path, method}}|{equals: {path, method}}], name: string, responses: [{is: {headers, statusCode: *}}]}}
 */
function patchUpdateWebhookSuccess (gatewayAccountId, serviceExternalId, webhookExternalId, patchOpts) {
  const path = `/v1/webhook/${webhookExternalId}`
  return stubBuilder('PATCH', path, 200, {
    request: [{
      op: 'replace',
      path: patchOpts.path,
      value: patchOpts.value
    }],
    query: {
      service_id: serviceExternalId,
      gateway_account_id: gatewayAccountId
    }
  })
}

/**
 *
 * @param {Number | String} gatewayAccountId
 * @param {String} serviceExternalId
 * @param {String} webhookExternalId
 * @param {[{ path: String, value: String | Array }]} patches
 * @returns {{predicates: [{deepEquals: {path, method}}|{equals: {path, method}}], name: string, responses: [{is: {headers, statusCode: *}}]}}
 */
function patchBatchUpdateWebhookSuccess (gatewayAccountId, serviceExternalId, webhookExternalId, patches) {
  const path = `/v1/webhook/${webhookExternalId}`
  return stubBuilder('PATCH', path, 200, {
    request: patches.map(patch => {
      return {
        op: 'replace',
        path: patch.path,
        value: patch.value
      }
    }),
    query: {
      service_id: serviceExternalId,
      gateway_account_id: gatewayAccountId
    }
  })
}

module.exports = {
  getWebhooksListSuccess,
  getWebhookSuccess,
  getWebhookSigningSecret,
  getWebhookMessagesListSuccess,
  getWebhookMessage,
  getWebhookMessageAttempts,
  postCreateWebhookSuccess,
  createWebhookViolatesBackend,
  patchUpdateWebhookSuccess,
  patchBatchUpdateWebhookSuccess,
  patchUpdateWebhookViolatesBackend
}
