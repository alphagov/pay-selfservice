const transactionFixtures = require('./ledger-transaction.fixtures')

function validWebhook (options = {}) {
  return {
    external_id: options.external_id || 'valid-webhooks-external-id',
    service_id: options.service_id || 'valid-service-id',
    live: options.live !== undefined ? options.live : true,
    callback_url: options.callback_url || 'https://some-callback-url.test',
    description: options.description || 'a valid webhook description',
    status: options.status || 'ACTIVE',
    created_date: options.created_date || '2021-08-20T14:00:00.000Z',
    subscriptions: options.subscriptions || ['card_payment_captured']
  }
}

function validWebhookMessageAttempt (options = {}) {
  return {
    status: options.status || 'SUCCESSFUL', // 'FAILED', 'PENDING', null
    created_at: options.created_at || '2021-08-20T14:00:00.000Z',
    send_at: options.send_at || '2021-08-20T14:00:00.000Z',
    status_code: options.status_code || 200,
    result: options.result || '200'
  }
}

function validWebhookMessage (options = {}) {
  return {
    external_id: options.external_id || 'valid-webhook-message-external-id',
    created_date: options.created_date || '2021-08-20T14:00:00.000Z',
    event_date: options.event_date || '2021-08-20T14:00:00.000Z',
    event_type: options.event_type || 'card_payment_captured',
    resource: transactionFixtures.validTransactionDetailsResponse(options.resource || { transaction_id: 'an-external-id' }),
    latest_attempt: validWebhookMessageAttempt(options.latest_attempt || {})
  }
}

function validSigningSecret (options = {}) {
  return {
    signing_key: options.signing_key || 'valid-signing-secret'
  }
}

function webhooksListResponse (options = []) {
  return options.map((option) => validWebhook(option))
}

function webhookMessageResponse (options = {}) {
  return validWebhookMessage(options)
}

function webhooksMessageAttemptsListResponse (options = []) {
  return options.map(validWebhookMessageAttempt)
}

function webhookResponse (options = {}) {
  return validWebhook(options)
}

function webhookSigningSecretResponse (options = {}) {
  return validSigningSecret(options)
}

function webhookMessageSearchResponse (options = {}) {
  const messages = options.messages || []
  return {
    count: messages.length,
    page: options.page || 1,
    results: messages.map(validWebhookMessage)
  }
}

module.exports = {
  webhooksListResponse,
  webhookResponse,
  webhookSigningSecretResponse,
  webhookMessageSearchResponse,
  webhooksMessageAttemptsListResponse,
  webhookMessageResponse
}
