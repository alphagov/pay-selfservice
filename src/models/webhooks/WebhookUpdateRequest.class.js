class WebhookUpdateRequest {
  constructor () {
    this.updates = []
  }

  replace () {
    return safeOperation('replace', this)
  }

  toJson () {
    return this.updates
  }
}

/**
 *
 * @param op {String}
 * @param request {WebhookUpdateRequest}
 * @returns {{subscriptions: (function(*): *), description: (function(*): *), callbackUrl: (function(*): *), status: (function(*): *)}}
 */
const safeOperation = (op, request) => {
  return {
    callbackUrl: (value) => {
      request.updates.push({ op, path: 'callback_url', value })
      return request
    },
    subscriptions: (value) => {
      request.updates.push({ op, path: 'subscriptions', value })
      return request
    },
    description: (value) => {
      request.updates.push({ op, path: 'description', value })
      return request
    },
    status: (value) => {
      request.updates.push({ op, path: 'status', value })
      return request
    }
  }
}

module.exports = WebhookUpdateRequest
