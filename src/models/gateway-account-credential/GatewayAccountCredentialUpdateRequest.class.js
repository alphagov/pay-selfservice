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
    credentials: () => {
      return {
        oneOffCustomerInitiated: (value) => {
          request.updates.push({ op, path: 'credentials/worldpay/one_off_customer_initiated', value })
          return request
        },
        recurringCustomerInitiated: (value) => {
          request.updates.push({ op, path: 'credentials/worldpay/recurring_customer_initiated', value })
          return request
        }
      }
    }
  }
}

module.exports = GatewayAccountCredentialUpdateRequest
