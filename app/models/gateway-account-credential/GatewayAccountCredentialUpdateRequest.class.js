'use strict'

class GatewayAccountCredentialUpdateRequest {
  /**
   * @param {String} userExternalId
   */
  constructor (userExternalId) {
    this.updates = [{
      op: 'replace',
      path: 'last_updated_by_user_external_id',
      value: userExternalId
    }]
  }

  replace () {
    return safeOperation('replace', this)
  }

  formatPayload () {
    return this.updates
  }
}

const safeOperation = (op, request) => {
  return {
    credentials: (value) => {
      request.updates.push({ op, path: 'credentials', value })
      return request
    }
  }
}
module.exports = { GatewayAccountCredentialUpdateRequest }
