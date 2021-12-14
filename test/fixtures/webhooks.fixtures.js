function validWebhook (options = {}) {
  return {
    external_id: options.external_id || 'valid-webhooks-external-id',
    service_id: options.service_id || 'valid-service-id',
    live: options.live !== undefined ? options.live : true,
    callback_url: options.callback_url || 'https://some-callback-url.com',
    description: options.description || 'a valid webhook description',
    status: options.status || 'ACTIVE',
    created_date: options.created_date || '2021-08-20T14:00:00.000Z',
    subscriptions: options.subscriptions || [ 'card_payment_captured' ]
  }
}

function validWebhookMessageAttempt(options = {}) {
  return {
    status: options.status || 'SUCCEEDED', // 'FAILED', 'PENDING'
    succeeded: options.succeeded || true,
    send_at: options.event_date || '2021-08-20T14:00:00.000Z'
  }
}

// mock webhook messages  -- should this have a pending retry date? does that have to be worked out? assuming yes
// mock webhook message attempts -- do we need to derive status on the consumer? assuming no
function validWebhookMessage(options = {}) {
  return {
    external_id: options.external_id || 'valid-webhook-message-external-id',
    created_date: options.created_date || '2021-08-20T14:00:00.000Z',
    event_date: options.event_date || '2021-08-20T14:00:00.000Z',
    event_type: options.event_type || 'card_payment_captured',
    status: options.status || 'SUCCEEDED', // 'FAILED', 'PENDING'
    ...options.attempts && options.attempts.map(validWebhookMessageAttempt)
  }
}

function validSigningSecret(options = {}) {
  return {
    signing_key: options.signing_key || 'valid-signing-secret'
  }
}

function webhooksListResponse (options = []) {
  return options.map((option) => validWebhook(option))
}

function webhookResponse (options = {}) {
  return validWebhook(options)
}

function webhookSigningSecretResponse(options = {}) {
  return validSigningSecret(options)
}

function webhookMessageSearchResponse(options = []) {
  return {
    total: options.length,
    count: options.length,
    page: 1,
    results: options.map(validWebhookMessage)
  }
}

module.exports = {
  webhooksListResponse,
  webhookResponse,
  webhookSigningSecretResponse,
  webhookMessageSearchResponse
}
